"""
Modo B: autenticacion FIDO2/WebAuthn real (la solucion segura).

------------------------------------------------------------------
POR QUE NO ES VULNERABLE A UNA FOTO:
------------------------------------------------------------------
Aca la biometria (huella, rostro via Windows Hello/Touch ID, PIN del
dispositivo) NUNCA viaja a este servidor. Solo se usa localmente, en
el autenticador de plataforma del usuario, para desbloquear una CLAVE
PRIVADA que tampoco sale del dispositivo. Lo unico que llega al backend
es una firma criptografica de un "challenge" aleatorio de un solo uso.

Nota sobre rp_id / origin: WebAuthn ata cada credencial al dominio exacto
(origin) desde el que se creo. Por eso rp_id y origin NO se hardcodean:
app.py los deriva del request real (localhost, LAN o el dominio de ngrok,
respetando X-Forwarded-Proto) y los pasa a estas funciones. Asi el Modo B
funciona sin importar como se accede al sitio, sin romperse al cambiar de
localhost a ngrok.
------------------------------------------------------------------
"""
import webauthn
from webauthn.helpers.structs import (
    AuthenticatorSelectionCriteria,
    AuthenticatorAttachment,
    UserVerificationRequirement,
    ResidentKeyRequirement,
    PublicKeyCredentialDescriptor,
)

import config
import db

# Metodos FIDO2 que puede elegir el usuario. Nota honesta: WebAuthn NO permite
# forzar "huella" vs "rostro" -eso lo decide el dispositivo segun lo que el
# usuario tenga configurado en Windows Hello / Touch ID-. Lo que si es realmente
# distinto es un autenticador de plataforma (huella/rostro/PIN del equipo) vs
# una "clave de acceso" (passkey = credencial descubrible/residente que puede
# sincronizar entre dispositivos). Guardamos ademas el label elegido para
# mostrarlo despues.
_METHODS = {
    "huella": {
        "label": "Huella digital",
        "attachment": AuthenticatorAttachment.PLATFORM,
        "resident_key": ResidentKeyRequirement.DISCOURAGED,
    },
    "rostro": {
        "label": "Reconocimiento facial",
        "attachment": AuthenticatorAttachment.PLATFORM,
        "resident_key": ResidentKeyRequirement.DISCOURAGED,
    },
    "passkey": {
        "label": "Clave de acceso (passkey)",
        "attachment": None,  # permite plataforma o passkey en otro dispositivo
        "resident_key": ResidentKeyRequirement.REQUIRED,
    },
}
_DEFAULT_METHOD = "huella"


def method_label(method_key):
    return _METHODS.get(method_key, _METHODS[_DEFAULT_METHOD])["label"]


def _authenticator_selection(method_key):
    spec = _METHODS.get(method_key, _METHODS[_DEFAULT_METHOD])
    return AuthenticatorSelectionCriteria(
        authenticator_attachment=spec["attachment"],
        resident_key=spec["resident_key"],
        user_verification=UserVerificationRequirement.REQUIRED,
    )


def build_registration_options(user, rp_id, method=_DEFAULT_METHOD):
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
        authenticator_selection=_authenticator_selection(method),
        exclude_credentials=exclude_credentials,
    )

    db.save_webauthn_challenge(user["id"], options.challenge, purpose="register")
    return webauthn.options_to_json(options)


def complete_registration(user, credential_json, rp_id, origin, method=_DEFAULT_METHOD):
    challenge_row = db.get_webauthn_challenge(user["id"], purpose="register")
    if challenge_row is None:
        raise ValueError("No hay un challenge de registro pendiente para este usuario.")

    parsed_credential = webauthn.helpers.parse_registration_credential_json(credential_json)

    verification = webauthn.verify_registration_response(
        credential=parsed_credential,
        expected_challenge=challenge_row["challenge"],
        expected_rp_id=rp_id,
        expected_origin=origin,
        require_user_verification=True,
    )

    db.save_webauthn_credential(
        user_id=user["id"],
        credential_id=verification.credential_id,
        public_key=verification.credential_public_key,
        sign_count=verification.sign_count,
        method=method_label(method),
    )
    # El challenge ya se uso: se descarta para que no pueda reutilizarse.
    db.delete_webauthn_challenge(user["id"], purpose="register")
    return True


def build_authentication_options(user, rp_id):
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

    db.save_webauthn_challenge(user["id"], options.challenge, purpose="authenticate")
    return webauthn.options_to_json(options)


def complete_authentication(user, credential_json, rp_id, origin):
    challenge_row = db.get_webauthn_challenge(user["id"], purpose="authenticate")
    if challenge_row is None:
        raise ValueError("No hay un challenge de autenticacion pendiente para este usuario.")

    parsed_credential = webauthn.helpers.parse_authentication_credential_json(credential_json)

    stored_credential = db.get_webauthn_credential_by_id(parsed_credential.raw_id)
    if stored_credential is None or stored_credential["user_id"] != user["id"]:
        raise ValueError("Credencial desconocida para este usuario.")

    verification = webauthn.verify_authentication_response(
        credential=parsed_credential,
        expected_challenge=challenge_row["challenge"],
        expected_rp_id=rp_id,
        expected_origin=origin,
        credential_public_key=stored_credential["public_key"],
        credential_current_sign_count=stored_credential["sign_count"],
        require_user_verification=True,
    )

    db.update_webauthn_sign_count(parsed_credential.raw_id, verification.new_sign_count)
    # Challenge de un solo uso: se descarta tras validar la firma.
    db.delete_webauthn_challenge(user["id"], purpose="authenticate")
    return True


def has_registered_credential(user_id):
    return len(db.get_webauthn_credentials_for_user(user_id)) > 0
