project-arq-web

# Sistema de Turnos para Barbería

Proyecto de **Arquitectura Web**. El objetivo es diseñar e implementar una aplicación web mobile para la gestión de turnos de una barbería, con foco en la relación barbero-cliente, pagos integrados y una evolución futura hacia un módulo de comercio.

## Objetivos
  - Ofrecer una experiencia de reserva simple y rápida.
  - Personalizar el vínculo con el cliente mediante perfiles, historial y preferencias.
  - Integrar pagos y promociones (por ejemplo: paquetes de "n cortes/mes").
  - Diseñar una base escalable para extender a e-commerce (merch, promos, gift cards, etc).

## Alcance (MVP)
  - **Autenticación y registro**: email+password y OAuth (Google, Facebook, etc).
  - **Perfiles**:
      - Cliente: nombre, foto, teléfono, preferencias, notas.
      - Barbero: bio, skills, horarios, portfolio, experiencia.
  - **Catálogo de servicios**: nombre, duración, precio, tiempo de limpieza/buffer.
  - **Agenda y reservas**:
      - Disponibilidad por barbero; slots calculados por servicio+duración.
      - Crear/consultar/reprogramar/cancelar turnos con política de no-show.
      - Recordatorios por email, Whatsapp/SMS.
  - **Pagos**:
      - Integración con pasarela (por ejemplo: MercadoPago).
      - Soporte de promociones y paquetes ("n cortes al mes").
  - **Panel administrativo**:
      - Gestión de servicios, horarios, precios y promociones.
      - Vista de calendario (día/semana) por barbero.
