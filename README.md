project-arq-web

# Sistema de Turnos para Barbería

Proyecto de **Arquitectura Web**. El objetivo es construir un **sistema de turnos** para barbería con **foco en la API HTTP**.

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

# CÓMO INSTALAR Y CORRER EL PROYECTO

## Requisitos:
  - **Node.js LTS (18.x o 20.x recomendado).
  - **npm 9+

## Clonar el repo:
  - git clone https://github.com/Fecu3799/project-arq-web.git
  - cd project-arq-web

## Instalar dependencias:
  - npm ci

## Correr en desarrollo:
  - Puerto 3000 liberado
  - npm run dev

## Correr tests:
  - npm test

# PROBAR LA API

## PUBLICOS

### Consultar servicios
  - curl "http://localhost:3000/api/v1/services"

### Disponibilidad del día:
  - curl "http://localhost:3000/api/v1/availability/day?date=01-01-30&service_id=1"

### Crear turnos:
  - curl -X POST "http://localhost:3000/api/v1/appointments" \
    -Header "Content-Type: application/json" \
    -req.body '{ "service_id": 1, "date": "01-01-30", "time": "09:00" }'


## ADMIN/BARBER

### Autenticación para ADMIN-requests
  - curl -X POST "http://localhost:3000/api/v1/auth/login" \
    - Header "Content-Type: application/json" \
    -req.body '{ "email": "admin@shop.com", "password": "secretpassword" }'
  
  - Auth Type: Bearer Token

### Consultar turnos (barber/admin)
  - curl "http://localhost:3000/api/v1/admin/appointments"

### Consultar servicios (activos/inactivos)
  - curl "http://localhost:3000/api/v1/admin/services"

### Crear un nuevo servicio
  - curl -X POST "http://localhost:3000/api/v1/admin/services"
    -Header "Content-Type: application/json" \
    -req.body '{ "name": <nuevoServicio>, "duration_min": <30/60/90>, "price": <integer>, "active": <optional:true/false> }'
  
  - Auth Type: Bearer Token

### Modificar un servicio
  - curl -X PATCH "http://localhost:3000/api/v1/admin/services/:id"
    -Header "Content-Type: application/json" \
    -req.body '{ "name": <nuevoNombre>, "duration_min": <nueva_duracion>, "price": <nuevo_precio>, "active": <true/false> }'
  
  - Auth Type: Bearer Token