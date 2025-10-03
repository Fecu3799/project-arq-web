project-arq-web

# Sistema de Turnos para Barbería

Proyecto de **Arquitectura Web**. El objetivo es construir un **sistema de turnos** para barbería con **foco en la API**: la interfaz será mínima; la prioridad es cómo modelamos recursos, pedidos y respuestas.

## La API permitirá:
  - Registrar y autenticar usuarios (cliente/barbero).
  - Publicar el catálogo de servicios (duración, precio, disponibilidad).
  - Crear, consultar, reprogramar y cancelar turnos.

## Alcance (MVP)
  - **Auth básica** (registro/login y roles).
  - **Servicios** (lectura pública).
  - **Disponibilidad** calculada a partir de horarios + duración.
  - **Turnos** con estados básicos (pendiente/confirmado/cancelado/no-show).
  - **Notificaciones** como stub (registro en log/cola; sin proveedor real).
  - **Pagos (opcional)**: flujo simulado para validar integraciones.

## Criterios de calidad de la API
  - **Control de versiones**.
  - **Validaciones y errores coherentes** (mensajes claros, códigos HTTP correctos).
  - **Paginación/filtrado** consistentes en listados.
  - **Observabilidad**: logs y trazas mínimas para seguir un turno de punta a punta.
  - **Tests**: unitarios y de integración sobre casos críticos (crear turno, reprogramar, cancelar).
