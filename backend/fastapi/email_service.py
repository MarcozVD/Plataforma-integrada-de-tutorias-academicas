import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from dotenv import load_dotenv

load_dotenv()

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
SMTP_FROM_NAME = "PITA - Tutorías UNAB"


def send_email(to: str, subject: str, html_body: str) -> bool:
    """Returns True if sent, False if skipped or failed."""
    if not SMTP_USER or not SMTP_PASS:
        print(f"[email] SMTP not configured — skipping: {subject} → {to}")
        return False
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = f"{SMTP_FROM_NAME} <{SMTP_USER}>"
    msg["To"]      = to
    msg.attach(MIMEText(html_body, "html", "utf-8"))
    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as srv:
            srv.ehlo()
            srv.starttls()
            srv.login(SMTP_USER, SMTP_PASS)
            srv.sendmail(SMTP_USER, to, msg.as_string())
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


# ── Templates ────────────────────────────────────────────────────────────────

_BASE = """
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:32px 16px;">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);">
        <tr><td style="background:linear-gradient(135deg,#00AEEF,#6B2D8B);padding:28px 32px;">
          <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">PITA · Tutorías UNAB</h1>
        </td></tr>
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

_BTN = '<a href="{url}" style="display:inline-block;margin-top:20px;padding:12px 24px;background:#00AEEF;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">{label}</a>'


def _render(content: str) -> str:
    return _BASE.replace("{content}", content)


def _h2(text: str) -> str:
    return f'<h2 style="margin:0 0 8px;color:#1e293b;font-size:18px;">{text}</h2>'


def _p(text: str) -> str:
    return f'<p style="margin:8px 0;color:#475569;font-size:14px;line-height:1.6;">{text}</p>'


def _info_row(label: str, value: str) -> str:
    return (
        f'<tr>'
        f'<td style="padding:8px 12px;color:#6b7280;font-size:13px;font-weight:600;white-space:nowrap;">{label}</td>'
        f'<td style="padding:8px 12px;color:#1e293b;font-size:13px;">{value}</td>'
        f'</tr>'
    )


def _info_table(*rows: str) -> str:
    inner = "".join(rows)
    return (
        f'<table cellpadding="0" cellspacing="0" style="margin:16px 0;background:#f8fafc;'
        f'border-radius:8px;border:1px solid #e2e8f0;width:100%;">{inner}</table>'
    )


# ── Public helpers ────────────────────────────────────────────────────────────

def email_welcome(to: str, full_name: str, user_type: str) -> None:
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


def email_session_cancelled_by_tutor(
    to: str,
    student_name: str,
    subject: str,
    date_str: str,
    time_str: str,
) -> None:
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
