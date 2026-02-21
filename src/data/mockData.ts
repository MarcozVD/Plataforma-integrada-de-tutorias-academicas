export interface Room {
  id: string;
  name: string;
  building: string;
  floor: string;
  capacity: number;
  accessibility: {
    wheelchair: boolean;
    visualSupport: boolean;
    hearingSupport: boolean;
  };
  available: boolean;
  currentTutoring?: string;
}

export interface Tutoring {
  id: string;
  subject: string;
  tutor: string;
  tutorId: string;
  room: string;
  roomId: string;
  date: string;
  time: string;
  duration: string;
  spots: number;
  spotsAvailable: number;
  accessibility: string[];
}

export interface Notification {
  id: string;
  type: 'reminder' | 'change' | 'cancellation' | 'recommendation';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export interface ScheduleBlock {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  subject: string;
  type: 'class' | 'free' | 'tutoring';
}

export const rooms: Room[] = [
  { id: '1', name: 'Aula 201', building: 'Edificio A', floor: '2do piso', capacity: 30, accessibility: { wheelchair: true, visualSupport: true, hearingSupport: false }, available: true },
  { id: '2', name: 'Aula 305', building: 'Edificio B', floor: '3er piso', capacity: 20, accessibility: { wheelchair: false, visualSupport: false, hearingSupport: true }, available: true },
  { id: '3', name: 'Lab 102', building: 'Edificio C', floor: '1er piso', capacity: 15, accessibility: { wheelchair: true, visualSupport: true, hearingSupport: true }, available: false, currentTutoring: 'Cálculo I' },
  { id: '4', name: 'Aula 410', building: 'Edificio A', floor: '4to piso', capacity: 40, accessibility: { wheelchair: true, visualSupport: false, hearingSupport: false }, available: true },
  { id: '5', name: 'Sala 108', building: 'Edificio D', floor: '1er piso', capacity: 10, accessibility: { wheelchair: true, visualSupport: true, hearingSupport: true }, available: true },
  { id: '6', name: 'Aula 203', building: 'Edificio B', floor: '2do piso', capacity: 25, accessibility: { wheelchair: false, visualSupport: false, hearingSupport: false }, available: false, currentTutoring: 'Física II' },
];

export const tutorings: Tutoring[] = [
  { id: '1', subject: 'Cálculo I', tutor: 'María García', tutorId: '1', room: 'Aula 201', roomId: '1', date: '2026-02-23', time: '10:00', duration: '1.5h', spots: 15, spotsAvailable: 8, accessibility: ['Silla de ruedas', 'Apoyo visual'] },
  { id: '2', subject: 'Programación II', tutor: 'Carlos López', tutorId: '2', room: 'Lab 102', roomId: '3', date: '2026-02-23', time: '14:00', duration: '2h', spots: 12, spotsAvailable: 3, accessibility: ['Silla de ruedas'] },
  { id: '3', subject: 'Álgebra Lineal', tutor: 'Ana Martínez', tutorId: '3', room: 'Aula 305', roomId: '2', date: '2026-02-24', time: '09:00', duration: '1h', spots: 20, spotsAvailable: 15, accessibility: ['Apoyo auditivo'] },
  { id: '4', subject: 'Física II', tutor: 'Pedro Ruiz', tutorId: '4', room: 'Sala 108', roomId: '5', date: '2026-02-24', time: '16:00', duration: '1.5h', spots: 10, spotsAvailable: 2, accessibility: ['Silla de ruedas', 'Apoyo visual', 'Apoyo auditivo'] },
  { id: '5', subject: 'Estadística', tutor: 'Laura Sánchez', tutorId: '5', room: 'Aula 410', roomId: '4', date: '2026-02-25', time: '11:00', duration: '1h', spots: 25, spotsAvailable: 20, accessibility: [] },
];

export const notifications: Notification[] = [
  { id: '1', type: 'reminder', title: 'Tutoría en 1 hora', message: 'Tu tutoría de Cálculo I comienza a las 10:00 en Aula 201.', time: 'Hace 5 min', read: false },
  { id: '2', type: 'recommendation', title: 'Tutoría recomendada', message: 'Hay una tutoría de Álgebra Lineal mañana que coincide con tu hora libre.', time: 'Hace 30 min', read: false },
  { id: '3', type: 'change', title: 'Cambio de salón', message: 'La tutoría de Física II se movió al Aula 203.', time: 'Hace 1 hora', read: true },
  { id: '4', type: 'cancellation', title: 'Tutoría cancelada', message: 'La tutoría de Programación II del viernes fue cancelada.', time: 'Hace 2 horas', read: true },
  { id: '5', type: 'recommendation', title: 'Salón disponible', message: 'El Aula 201, que usas frecuentemente, está disponible ahora.', time: 'Hace 3 horas', read: true },
];

export const schedule: ScheduleBlock[] = [
  { id: '1', day: 'Lunes', startTime: '07:00', endTime: '09:00', subject: 'Cálculo I', type: 'class' },
  { id: '2', day: 'Lunes', startTime: '09:00', endTime: '10:00', subject: '', type: 'free' },
  { id: '3', day: 'Lunes', startTime: '10:00', endTime: '12:00', subject: 'Física II', type: 'class' },
  { id: '4', day: 'Martes', startTime: '08:00', endTime: '10:00', subject: 'Programación II', type: 'class' },
  { id: '5', day: 'Martes', startTime: '10:00', endTime: '11:30', subject: 'Tutoría Álgebra', type: 'tutoring' },
  { id: '6', day: 'Martes', startTime: '14:00', endTime: '16:00', subject: 'Álgebra Lineal', type: 'class' },
  { id: '7', day: 'Miércoles', startTime: '07:00', endTime: '09:00', subject: 'Cálculo I', type: 'class' },
  { id: '8', day: 'Miércoles', startTime: '09:00', endTime: '12:00', subject: '', type: 'free' },
  { id: '9', day: 'Jueves', startTime: '08:00', endTime: '10:00', subject: 'Estadística', type: 'class' },
  { id: '10', day: 'Jueves', startTime: '10:00', endTime: '12:00', subject: '', type: 'free' },
  { id: '11', day: 'Viernes', startTime: '09:00', endTime: '11:00', subject: 'Física II', type: 'class' },
  { id: '12', day: 'Viernes', startTime: '11:00', endTime: '13:00', subject: '', type: 'free' },
];
