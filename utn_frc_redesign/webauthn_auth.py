"""
Modo B: identificación (legajo + dominio + contraseña) + confirmación FIDO2/WebAuthn.

------------------------------------------------------------------
COMO FUNCIONA EL SEGUNDO FACTOR:
------------------------------------------------------------------
A diferencia de un login "usernameless", aca el usuario ya fue identificado
en el paso 1 (legajo + "@" + contraseña, ver app.py `/api/login/mfa`). Por
eso `build_authentication_options` recibe el usuario y arma un
`allow_credentials` acotado a SUS propias credenciales: el navegador solo
ofrece esas, no cualquiera guardada en el dispositivo.

La biometria (huella, rostro, PIN del autenticador) nunca sale del
dispositivo del usuario: solo se usa localmente para desbloquear la clave
privada que firma un challenge aleatorio de un solo uso. El servidor jamás
recibe datos biometricos.

El challenge se guarda en la sesion de Flask (cookie firmada) entre el
`begin` y el `complete`, no en la base de datos: es efimero y de un solo uso.
------------------------------------------------------------------
"""
import webauthn
from webauthn.helpers.structs import (
    AuthenticatorAttachment,
    AuthenticatorSelectionCriteria,
    ResidentKeyRequirement,
    UserVerificationRequirement,
    PublicKeyCredentialDescriptor,
)

import config
import db

# authenticator_attachment=PLATFORM: le pide al navegador un autenticador
# de plataforma (Windows Hello, Touch ID), nunca una llave externa. Es el
# SO el que decide ahi si pide huella, PIN o rostro segun lo que el
# dispositivo tenga configurado - la app solo pide "autenticador de
# plataforma", nunca implementa su propia biometria (ver portal.html: las
# 3 opciones de la UI son solo para guiar al usuario, las tres disparan
# este mismo registro).
_AUTHENTICATOR_SELECTION = AuthenticatorSelectionCriteria(
    authenticator_attachment=AuthenticatorAttachment.PLATFORM,
    resident_key=ResidentKeyRequirement.DISCOURAGED,
    user_verification=UserVerificationRequirement.REQUIRED,
)


def build_registration_options(user, rp_id):
    """Genera las opciones para registrar una passkey de ESTE usuario ya logueado."""
    existing_credentials = db.get_webauthn_credentials_for_user(user["id"])
    exclude_credentials = [
        PublicKeyCredentialDescriptor(id=cred["credential_id"])
        for cred in existing_credentials
    ]

    options = webauthn.generate_registration_options(
        rp_id=rp_id,
        rp_name=config.WEBAUTHN_RP_NAME,
        user_id=str(user["id"]).encode("utf-8"),
        user_name=user["email"],
        user_display_name=user["full_name"],
        authenticator_selection=_AUTHENTICATOR_SELECTION,
        exclude_credentials=exclude_credentials,
    )
    return options


def complete_registration(user, credential_json, expected_challenge, rp_id, origin):
    parsed_credential = webauthn.helpers.parse_registration_credential_json(credential_json)

    verification = webauthn.verify_registration_response(
        credential=parsed_credential,
        expected_challenge=expected_challenge,
        expected_rp_id=rp_id,
        expected_origin=origin,
        require_user_verification=True,
    )

    db.save_webauthn_credential(
        user_id=user["id"],
        credential_id=verification.credential_id,
        public_key=verification.credential_public_key,
        sign_count=verification.sign_count,
    )
    return True


def build_authentication_options(user, rp_id):
    """Opciones de autenticacion acotadas a las credenciales de un usuario
    YA identificado por legajo/dominio/contraseña (segundo factor del Modo B).
    """
    existing_credentials = db.get_webauthn_credentials_for_user(user["id"])
    allow_credentials = [
        PublicKeyCredentialDescriptor(id=cred["credential_id"])
        for cred in existing_credentials
    ]

    options = webauthn.generate_authentication_options(
        rp_id=rp_id,
        allow_credentials=allow_credentials,
        user_verification=UserVerificationRequirement.REQUIRED,
    )
    return options


def complete_authentication(user, credential_json, expected_challenge, rp_id, origin):
    """Verifica que la firma corresponda a una credencial de ESTE usuario.

    Levanta ValueError si la credencial es desconocida, pertenece a otro
    usuario, o la firma no valida.
    """
    parsed_credential = webauthn.helpers.parse_authentication_credential_json(credential_json)

    stored_credential = db.get_webauthn_credential_by_id(parsed_credential.raw_id)
    if stored_credential is None or stored_credential["user_id"] != user["id"]:
        raise ValueError("Credencial desconocida para este usuario.")

    verification = webauthn.verify_authentication_response(
        credential=parsed_credential,
        expected_challenge=expected_challenge,
        expected_rp_id=rp_id,
        expected_origin=origin,
        credential_public_key=stored_credential["public_key"],
        credential_current_sign_count=stored_credential["sign_count"],
        require_user_verification=True,
    )

    db.update_webauthn_sign_count(parsed_credential.raw_id, verification.new_sign_count)
    return True
