"""
╔════════════════════════════════════════════════════════════════════════════════╗
║              SERVICIO DE CORREOS ELECTRÓNICOS - FastAPI                        ║
║              Envío de notificaciones por email a usuarios                       ║
╚════════════════════════════════════════════════════════════════════════════════╝

PROPÓSITO GENERAL:
  Centraliza todo el envío de correos electrónicos del sistema.
  Proporciona funciones para cada tipo de notificación (bienvenida, inscripción, etc.)

TIPOS DE CORREOS:
  1. email_welcome - Bienvenida al registrarse
  2. email_enrollment_confirmation - Confirmación de inscripción en sesión
  3. email_enrollment_cancelled - Cancelación de inscripción
  4. email_reminder - Recordatorio 1 hora antes de sesión
  5. email_password_reset - Recuperación de contraseña
  6. email_waitlist_spot_available - Notificación de cupo disponible
  7. email_session_cancelled_by_tutor - Cancelación de sesión por tutor

FLUJO:
  Evento en sistema → Se llama función correspondiente → Se renderiza HTML → Se envía por SMTP
"""

import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from dotenv import load_dotenv

# ════════════════════════════════════════════════════════════════════════════════
# CONFIGURACIÓN SMTP
# ════════════════════════════════════════════════════════════════════════════════

load_dotenv()  # Carga variables de entorno del archivo .env

# Configuración del servidor SMTP (por defecto Gmail)
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")  # Servidor SMTP a usar
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))  # Puerto SMTP (587 para TLS)
SMTP_USER = os.getenv("SMTP_USER", "")  # Correo que envía (necesita contraseña de app)
SMTP_PASS = os.getenv("SMTP_PASS", "")  # Contraseña de app Gmail/servicio
SMTP_FROM_NAME = "PITA - Tutorías UNAB"  # Nombre que aparece en "De:"


# ════════════════════════════════════════════════════════════════════════════════
# FUNCIÓN BASE: Envío genérico de correos
# ════════════════════════════════════════════════════════════════════════════════

def send_email(to: str, subject: str, html_body: str) -> bool:
    """
    PROPÓSITO: Función genérica que envía un correo por SMTP
    
    PARÁMETROS:
      - to: Dirección de correo del destinatario
      - subject: Asunto del correo
      - html_body: Contenido HTML del correo
      
    FLUJO:
      1. Valida que esté configurado SMTP (credenciales presentes)
      2. Crea mensaje MIME con headers
      3. Conecta a servidor SMTP
      4. Autentica y envía
      5. Maneja excepciones de SMTP
      
    RETORNA:
      - True si se envió exitosamente
      - False si no se pudo enviar (sin credenciales, error SMTP, etc.)
    """
    # Valida configuración de SMTP
    if not SMTP_USER or not SMTP_PASS:
        print(f"[email] SMTP not configured — skipping: {subject} → {to}")
        return False
    
    # Crea mensaje MIME multipart (para soportar HTML)
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = f"{SMTP_FROM_NAME} <{SMTP_USER}>"
    msg["To"]      = to
    msg.attach(MIMEText(html_body, "html", "utf-8"))  # Adjunta HTML
    
    try:
        # Conecta a servidor SMTP con timeout de 10 segundos
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as srv:
            srv.ehlo()  # Saludo inicial al servidor
            srv.starttls()  # Inicia conexión TLS encriptada
            srv.login(SMTP_USER, SMTP_PASS)  # Autentica
            srv.sendmail(SMTP_USER, to, msg.as_string())  # Envía el mensaje
        print(f"[email] Sent '{subject}' → {to}")
        return True
    except smtplib.SMTPAuthenticationError:
        print(f"[email] AUTH ERROR — check SMTP_USER/SMTP_PASS credentials")
        return False
    except smtplib.SMTPException as e:
        print(f"[email] SMTP ERROR sending to {to}: {e}")
        return False
    except Exception as e:
        print(f"[email] ERROR sending to {to}: {e}")
        return False


# ════════════════════════════════════════════════════════════════════════════════
# PLANTILLAS HTML Y FUNCIONES AUXILIARES
# ════════════════════════════════════════════════════════════════════════════════

# Template base para todos los correos: estructura HTML responsiva
_BASE = """
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:32px 16px;">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);">
        <!-- Header con logo y marca -->
        <tr><td style="background:linear-gradient(135deg,#00AEEF,#6B2D8B);padding:28px 32px;">
          <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">PITA · Tutorías UNAB</h1>
        </td></tr>
        <!-- Contenido insertable -->
        <tr><td style="padding:32px;">
          {content}
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0;">
          <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">
            Este correo fue generado automáticamente. Por favor no respondas a este mensaje.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
"""

# Botón HTML reutilizable
_BTN = '<a href="{url}" style="display:inline-block;margin-top:20px;padding:12px 24px;background:#00AEEF;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">{label}</a>'


def _render(content: str) -> str:
    """Inserta contenido en la plantilla base"""
    return _BASE.replace("{content}", content)


def _h2(text: str) -> str:
    """Genera etiqueta <h2> con estilos"""
    return f'<h2 style="margin:0 0 8px;color:#1e293b;font-size:18px;">{text}</h2>'


def _p(text: str) -> str:
    """Genera párrafo <p> con estilos"""
    return f'<p style="margin:8px 0;color:#475569;font-size:14px;line-height:1.6;">{text}</p>'


def _info_row(label: str, value: str) -> str:
    """Genera fila de tabla para información estructurada"""
    return (
        f'<tr>'
        f'<td style="padding:8px 12px;color:#6b7280;font-size:13px;font-weight:600;white-space:nowrap;">{label}</td>'
        f'<td style="padding:8px 12px;color:#1e293b;font-size:13px;">{value}</td>'
        f'</tr>'
    )


def _info_table(*rows: str) -> str:
    """Genera tabla de información con múltiples filas"""
    inner = "".join(rows)
    return (
        f'<table cellpadding="0" cellspacing="0" style="margin:16px 0;background:#f8fafc;'
        f'border-radius:8px;border:1px solid #e2e8f0;width:100%;">{inner}</table>'
    )


# ════════════════════════════════════════════════════════════════════════════════
# FUNCIONES PÚBLICAS: Generadores de correos específicos
# ════════════════════════════════════════════════════════════════════════════════

def email_welcome(to: str, full_name: str, user_type: str) -> None:
    """
    PROPÓSITO: Envía correo de bienvenida cuando un usuario se registra
    
    PARÁMETROS:
      - to: Correo del usuario nuevo
      - full_name: Nombre completo del usuario
      - user_type: Tipo de usuario ("student" o "tutor")
    """
    role = "tutor" if user_type == "tutor" else "estudiante"
    content = (
        _h2(f"¡Bienvenido/a a PITA, {full_name}!") +
        _p(f"Tu cuenta como <strong>{role}</strong> ha sido creada exitosamente.") +
        _p("Ya puedes iniciar sesión y explorar la plataforma de tutorías académicas de la UNAB.")
    )
    send_email(to, "¡Bienvenido/a a PITA - Tutorías UNAB!", _render(content))


def email_enrollment_confirmation(
    to: str,
    student_name: str,
    subject: str,
    tutor_name: str,
    date_str: str,
    time_str: str,
    room: str | None,
    duration: int,
) -> None:
    """
    PROPÓSITO: Envía confirmación cuando estudiante se inscribe en una sesión
    
    PARÁMETROS:
      - to: Correo del estudiante
      - student_name: Nombre del estudiante
      - subject: Materia de la sesión
      - tutor_name: Nombre del tutor
      - date_str: Fecha formateada (DD/MM/YYYY)
      - time_str: Hora formateada (HH:MM)
      - room: Aula (o None si aún no asignada)
      - duration: Duración en minutos
    """
    room_label = room or "Por definir"
    content = (
        _h2("¡Inscripción confirmada!") +
        _p(f"Hola <strong>{student_name}</strong>, te has inscrito exitosamente en la siguiente tutoría:") +
        _info_table(
            _info_row("📚 Materia",  subject),
            _info_row("👤 Tutor",    tutor_name),
            _info_row("📅 Fecha",    date_str),
            _info_row("🕐 Hora",     time_str),
            _info_row("📍 Salón",    room_label),
            _info_row("⏱ Duración", f"{duration} min"),
        ) +
        _p("Recuerda llegar a tiempo. Puedes cancelar tu inscripción desde la plataforma si ya no puedes asistir.")
    )
    send_email(to, f"Inscripción confirmada: {subject}", _render(content))


def email_enrollment_cancelled(
    to: str,
    student_name: str,
    subject: str,
    date_str: str,
    time_str: str,
) -> None:
    """
    PROPÓSITO: Notifica cancelación de inscripción del estudiante
    """
    content = (
        _h2("Inscripción cancelada") +
        _p(f"Hola <strong>{student_name}</strong>, tu inscripción a la siguiente tutoría ha sido cancelada:") +
        _info_table(
            _info_row("📚 Materia", subject),
            _info_row("📅 Fecha",   date_str),
            _info_row("🕐 Hora",    time_str),
        ) +
        _p("El cupo quedará disponible para otro estudiante. Puedes inscribirte en otras tutorías desde la plataforma.")
    )
    send_email(to, f"Inscripción cancelada: {subject}", _render(content))


def email_reminder(
    to: str,
    student_name: str,
    subject: str,
    tutor_name: str,
    date_str: str,
    time_str: str,
    room: str | None,
    duration: int,
) -> None:
    """
    PROPÓSITO: Envía recordatorio 1 hora antes de que comience la sesión (scheduler automático)
    
    PARÁMETROS: Igual que email_enrollment_confirmation
    """
    room_label = room or "Por definir"
    content = (
        _h2("⏰ Tu tutoría empieza en 1 hora") +
        _p(f"Hola <strong>{student_name}</strong>, este es un recordatorio de tu próxima tutoría:") +
        _info_table(
            _info_row("📚 Materia",  subject),
            _info_row("👤 Tutor",    tutor_name),
            _info_row("📅 Fecha",    date_str),
            _info_row("🕐 Hora",     time_str),
            _info_row("📍 Salón",    room_label),
            _info_row("⏱ Duración", f"{duration} min"),
        ) +
        _p("Recuerda llegar unos minutos antes. ¡Mucho éxito!")
    )
    send_email(to, f"Recordatorio: tutoría de {subject} en 1 hora", _render(content))


def email_password_reset(to: str, full_name: str, reset_url: str) -> None:
    """
    PROPÓSITO: Envía enlace de recuperación de contraseña
    
    PARÁMETROS:
      - to: Correo del usuario
      - full_name: Nombre del usuario
      - reset_url: URL con token para resetear contraseña (válida 30 min)
    """
    content = (
        _h2("Recuperar contraseña") +
        _p(f"Hola <strong>{full_name}</strong>, recibimos una solicitud para restablecer tu contraseña.") +
        _p("Haz clic en el botón de abajo para crear una nueva contraseña. El enlace es válido por <strong>30 minutos</strong>.") +
        _BTN.format(url=reset_url, label="Restablecer contraseña") +
        _p("Si no solicitaste este cambio, puedes ignorar este correo.")
    )
    send_email(to, "Restablecer contraseña - PITA UNAB", _render(content))


def email_waitlist_spot_available(
    to: str,
    student_name: str,
    subject: str,
    date_str: str,
    time_str: str,
) -> None:
    """
    PROPÓSITO: Notifica al estudiante que hay cupo disponible en sesión donde estaba en lista de espera
    """
    content = (
        _h2("¡Hay un cupo disponible!") +
        _p(f"Hola <strong>{student_name}</strong>, se liberó un cupo en la tutoría en la que estabas en lista de espera:") +
        _info_table(
            _info_row("📚 Materia", subject),
            _info_row("📅 Fecha",   date_str),
            _info_row("🕐 Hora",    time_str),
        ) +
        _p("Ingresa a la plataforma para inscribirte antes de que se llene nuevamente.")
    )
    send_email(to, f"Cupo disponible: {subject}", _render(content))


def email_session_cancelled_by_tutor(
    to: str,
    student_name: str,
    subject: str,
    date_str: str,
    time_str: str,
) -> None:
    """
    PROPÓSITO: Notifica a estudiante inscritos que la sesión fue cancelada por el tutor
    """
    content = (
        _h2("Tutoría cancelada por el tutor") +
        _p(f"Hola <strong>{student_name}</strong>, lamentamos informarte que la siguiente tutoría ha sido cancelada:") +
        _info_table(
            _info_row("📚 Materia", subject),
            _info_row("📅 Fecha",   date_str),
            _info_row("🕐 Hora",    time_str),
        ) +
        _p("Te recomendamos buscar otra tutoría disponible en la plataforma.")
    )
    send_email(to, f"Tutoría cancelada: {subject}", _render(content))
