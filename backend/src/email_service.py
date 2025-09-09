"""
Servicio de correo electrónico para notificaciones de reportes diarios
Basado en el email_service de InemecTest
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pathlib import Path
import os
from typing import Dict, Any, Tuple, List
from datetime import datetime, date, time
import asyncio
from config import settings

class EmailService:
    def __init__(self):
        # Configuración SMTP para Outlook/Office365
        self.smtp_server = "smtp.office365.com"
        self.smtp_port = 587
        
        # Configuración de correo - Se obtienen de variables de entorno por seguridad
        self.sender_email = os.getenv("EMAIL_SENDER", "reportes@inemec.com")
        self.sender_password = os.getenv("EMAIL_PASSWORD", "")
        self.sender_name = "Sistema de Reportes Diarios - INEMEC"
        
        # Lista de administradores y sus correos
        self.admin_emails = {
            "Adriana Robayo": "administrador@inemec-pyc.com",
            "Angela Ramirez": "admon.vrc@inemec.com", 
            "Floribe Correa": "asistente.admonrh@inemec.com",
            "Julieth Rincon": "administradora.sc@inemec.com",
            "Eddinson Javier Martinez": "admincus.ggs@inemec.com",
            "Jorge Iván Alvarado Celis": "adminflo.ggs@inemec.com",
            "Kenia Sanchez": "admon.sierracolclm@inemec.com",
            "Liliana Romero": "contadora@inemec.com",
            "Marcela Cusba Gomez": "administrador.ggs@inemec.com",
            "Mirledys Garcia San Juan": "admonjr.sierracolcrm@inemec.com",
            "Yolima Arenas Zarate": "admincup.ggs@inemec.com",
        }
        
        # Configuración de horarios para recordatorios
        self.reminder_time = time(9, 0)  # 9:00 AM
        self.late_reminder_time = time(15, 0)  # 3:00 PM para recordatorio tardío
        
    def send_daily_reminder(self, admin_name: str, report_status: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Enviar recordatorio diario a un administrador específico
        
        Args:
            admin_name: Nombre del administrador
            report_status: Estado de reportes del día
            
        Returns:
            Tuple[bool, str]: (éxito, mensaje)
        """
        if admin_name not in self.admin_emails:
            return False, f"Email no encontrado para administrador: {admin_name}"
            
        recipient_email = self.admin_emails[admin_name]
        
        try:
            # Crear mensaje
            msg = MIMEMultipart('related')
            
            # Determinar tipo de recordatorio
            current_time = datetime.now().time()
            if not report_status.get('ha_reportado', False):
                if current_time >= self.late_reminder_time:
                    msg['Subject'] = "🚨 URGENTE: Reporte Diario Pendiente - INEMEC"
                    template_type = "urgent_reminder"
                else:
                    msg['Subject'] = "📋 Recordatorio: Reporte Diario - INEMEC"
                    template_type = "daily_reminder"
            else:
                msg['Subject'] = "✅ Confirmación: Reporte Diario Recibido - INEMEC"
                template_type = "confirmation"
            
            msg['From'] = f"{self.sender_name} <{self.sender_email}>"
            msg['To'] = recipient_email
            
            # Generar contenido HTML
            html_content = self._generate_reminder_html(admin_name, report_status, template_type)
            
            # Adjuntar HTML
            msg.attach(MIMEText(html_content, 'html'))
            
            # Enviar correo
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.sender_email, self.sender_password)
                server.send_message(msg)
                
            return True, f"Recordatorio enviado a {admin_name}"
            
        except smtplib.SMTPAuthenticationError:
            return False, "Error de autenticación SMTP. Verificar credenciales."
        except smtplib.SMTPException as e:
            return False, f"Error SMTP: {str(e)}"
        except Exception as e:
            return False, f"Error enviando recordatorio: {str(e)}"
    
    def send_bulk_reminders(self, admin_statuses: Dict[str, Dict]) -> Dict[str, Tuple[bool, str]]:
        """
        Enviar recordatorios masivos a múltiples administradores
        
        Args:
            admin_statuses: Diccionario con estados de reportes por administrador
            
        Returns:
            Dict[str, Tuple[bool, str]]: Resultados por administrador
        """
        results = {}
        
        for admin_name, status in admin_statuses.items():
            try:
                success, message = self.send_daily_reminder(admin_name, status)
                results[admin_name] = (success, message)
                
                # Pequeña pausa para evitar rate limiting
                import time
                time.sleep(1)
                
            except Exception as e:
                results[admin_name] = (False, f"Error enviando a {admin_name}: {str(e)}")
        
        return results
    
    def _generate_reminder_html(self, admin_name: str, report_status: Dict[str, Any], template_type: str) -> str:
        """
        Generar HTML para diferentes tipos de recordatorio
        
        Args:
            admin_name: Nombre del administrador
            report_status: Estado de reportes
            template_type: Tipo de plantilla (daily_reminder, urgent_reminder, confirmation)
            
        Returns:
            str: Contenido HTML
        """
        today = date.today().strftime('%d de %B de %Y')
        current_time = datetime.now().strftime('%H:%M')
        
        # Colores y mensajes según el tipo
        if template_type == "urgent_reminder":
            primary_color = "#dc2626"  # Rojo urgente
            icon = "🚨"
            title = "REPORTE DIARIO PENDIENTE"
            message_type = "urgente"
            action_text = "Es importante que complete su reporte antes del final del día."
        elif template_type == "daily_reminder":
            primary_color = "#2563eb"  # Azul normal
            icon = "📋"
            title = "RECORDATORIO: Reporte Diario"
            message_type = "recordatorio"
            action_text = "Por favor complete su reporte diario tan pronto como sea posible."
        else:  # confirmation
            primary_color = "#16a34a"  # Verde confirmación
            icon = "✅"
            title = "REPORTE RECIBIDO EXITOSAMENTE"
            message_type = "confirmación"
            action_text = "Gracias por enviar su reporte puntualmente."
        
        # Información de reportes existentes
        reportes_info = ""
        if report_status.get('reportes_enviados', 0) > 0:
            reportes_info = f"""
            <div style="background: #f0f9ff; padding: 1rem; border-radius: 8px; border-left: 4px solid #2563eb; margin: 1rem 0;">
                <strong>📊 Reportes enviados hoy:</strong> {report_status.get('reportes_enviados', 0)}
                <br><small style="color: #666;">Puede enviar reportes adicionales si es necesario.</small>
            </div>
            """
        
        html_template = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Recordatorio Reporte Diario - INEMEC</title>
            <style>
                body {{ 
                    font-family: 'Segoe UI', Arial, sans-serif; 
                    margin: 0; 
                    padding: 20px; 
                    background-color: #f5f5f5;
                    line-height: 1.6;
                }}
                .container {{ 
                    max-width: 600px; 
                    margin: 0 auto; 
                    background-color: white;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }}
                .header {{ 
                    background: linear-gradient(135deg, {primary_color} 0%, {primary_color}dd 100%);
                    color: white;
                    padding: 2rem;
                    text-align: center;
                }}
                .content {{ 
                    padding: 2rem;
                }}
                .alert-box {{
                    background: {primary_color}11;
                    border-left: 4px solid {primary_color};
                    padding: 1.5rem;
                    margin: 1rem 0;
                    border-radius: 0 8px 8px 0;
                }}
                .info-grid {{ 
                    display: grid; 
                    grid-template-columns: 1fr 1fr; 
                    gap: 1rem; 
                    margin: 1.5rem 0;
                }}
                .info-card {{ 
                    background: #f8f9fa; 
                    padding: 1rem; 
                    border-radius: 8px;
                    text-align: center;
                }}
                .action-button {{
                    display: inline-block;
                    background: {primary_color};
                    color: white;
                    padding: 12px 24px;
                    text-decoration: none;
                    border-radius: 6px;
                    font-weight: bold;
                    margin: 1rem 0;
                }}
                .footer {{
                    background: #f8f9fa;
                    padding: 1.5rem;
                    text-align: center;
                    color: #666;
                    font-size: 0.9rem;
                    border-top: 1px solid #e9ecef;
                }}
                h1 {{ margin: 0; font-size: 1.5rem; }}
                h2 {{ color: #333; margin-bottom: 1rem; }}
                .timestamp {{ 
                    background: #e9ecef; 
                    padding: 0.5rem 1rem; 
                    border-radius: 20px; 
                    font-size: 0.85rem;
                    color: #495057;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>{icon} {title}</h1>
                    <p style="margin: 0.5rem 0 0 0; opacity: 0.9;">
                        Sistema de Reportes Diarios - INEMEC
                    </p>
                </div>
                
                <div class="content">
                    <div class="alert-box">
                        <strong>Estimado(a) {admin_name},</strong>
                        <p style="margin: 0.5rem 0;">
                            Este es un {message_type} sobre su reporte diario correspondiente al día de hoy.
                        </p>
                    </div>
                    
                    <div class="info-grid">
                        <div class="info-card">
                            <strong>📅 Fecha</strong>
                            <div>{today}</div>
                        </div>
                        <div class="info-card">
                            <strong>🕐 Hora</strong>
                            <div>{current_time}</div>
                        </div>
                    </div>
                    
                    {reportes_info}
                    
                    <div style="text-align: center; margin: 2rem 0;">
                        <p style="font-size: 1.1rem; margin-bottom: 1rem;">
                            {action_text}
                        </p>
                        
                        {"" if template_type == "confirmation" else '''
                        <a href="http://admin-reports.inemec.com" class="action-button">
                            📝 Acceder al Sistema de Reportes
                        </a>
                        '''}
                    </div>
                    
                    <div style="background: #fff3cd; padding: 1rem; border-radius: 8px; border: 1px solid #ffc107;">
                        <strong>💡 Información importante:</strong>
                        <ul style="margin: 0.5rem 0; padding-left: 1.5rem;">
                            <li>Los reportes deben enviarse antes de las 6:00 PM</li>
                            <li>Puede enviar múltiples reportes si es necesario</li>
                            <li>En caso de problemas técnicos, contacte a TI</li>
                        </ul>
                    </div>
                </div>
                
                <div class="footer">
                    <p style="margin: 0;">
                        <strong>Sistema automatizado de recordatorios</strong><br>
                        Equipo de Nuevas Tecnologías - INEMEC<br>
                        <small>Este correo se envía automáticamente. No responda a este mensaje.</small>
                    </p>
                    <div class="timestamp">
                        Generado el {datetime.now().strftime('%d/%m/%Y a las %H:%M')}
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
        
        return html_template
    
    def send_summary_report(self, daily_summary: Dict[str, Any], recipients: List[str]) -> Tuple[bool, str]:
        """
        Enviar reporte resumen diario a supervisores/gerentes
        
        Args:
            daily_summary: Resumen de reportes del día
            recipients: Lista de correos de destinatarios
            
        Returns:
            Tuple[bool, str]: (éxito, mensaje)
        """
        try:
            for recipient in recipients:
                msg = MIMEMultipart()
                msg['Subject'] = f"📊 Resumen Diario de Reportes - {date.today().strftime('%d/%m/%Y')}"
                msg['From'] = f"{self.sender_name} <{self.sender_email}>"
                msg['To'] = recipient
                
                # Generar HTML del resumen
                html_content = self._generate_summary_html(daily_summary)
                msg.attach(MIMEText(html_content, 'html'))
                
                # Enviar
                with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                    server.starttls()
                    server.login(self.sender_email, self.sender_password)
                    server.send_message(msg)
            
            return True, f"Resumen enviado a {len(recipients)} destinatarios"
            
        except Exception as e:
            return False, f"Error enviando resumen: {str(e)}"
    
    def _generate_summary_html(self, summary: Dict[str, Any]) -> str:
        """Generar HTML para reporte resumen"""
        today = date.today().strftime('%d de %B de %Y')
        
        # Aquí se puede expandir para incluir gráficos y estadísticas más detalladas
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Resumen Diario - INEMEC</title>
        </head>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5;">
            <div style="max-width: 800px; margin: 0 auto; background: white; border-radius: 12px; padding: 2rem;">
                <h1 style="color: #c62828; text-align: center;">📊 Resumen Diario de Reportes</h1>
                <p style="text-align: center; color: #666; font-size: 1.1rem;">{today}</p>
                
                <div style="background: #f0f9ff; padding: 1.5rem; border-radius: 8px; margin: 2rem 0;">
                    <h2>Estadísticas del Día</h2>
                    <p><strong>Total de reportes recibidos:</strong> {summary.get('total_reportes', 0)}</p>
                    <p><strong>Administradores que reportaron:</strong> {summary.get('admins_reportaron', 0)}</p>
                    <p><strong>Administradores pendientes:</strong> {summary.get('admins_pendientes', 0)}</p>
                </div>
                
                <div style="text-align: center; margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e9ecef; color: #666;">
                    Sistema automatizado de reportes - INEMEC<br>
                    <small>Generado automáticamente</small>
                </div>
            </div>
        </body>
        </html>
        """
        
        return html
    
    def test_connection(self) -> Tuple[bool, str]:
        """
        Probar conexión SMTP
        
        Returns:
            Tuple[bool, str]: (éxito, mensaje)
        """
        try:
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.sender_email, self.sender_password)
                return True, "Conexión SMTP exitosa"
        except smtplib.SMTPAuthenticationError:
            return False, "Error de autenticación. Verificar credenciales."
        except Exception as e:
            return False, f"Error de conexión: {str(e)}"


# Instancia global del servicio
email_service = EmailService()