import { sequelize } from '../config/database';
import { User } from './User';
import { Professional } from './Professional';
import { Service } from './Service';
import { ProfessionalService } from './ProfessionalService';
import { Availability } from './Availability';
import { AvailabilityException } from './AvailabilityException';
import { Appointment } from './Appointment';
import { ClinicalRecord } from './ClinicalRecord';
import { SupportRequest } from './SupportRequest';

User.hasOne(Professional, { foreignKey: 'userId', as: 'professionalProfile' });
Professional.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Professional.belongsToMany(Service, {
  through: ProfessionalService,
  foreignKey: 'professionalId',
  otherKey: 'serviceId',
  as: 'services',
});
Service.belongsToMany(Professional, {
  through: ProfessionalService,
  foreignKey: 'serviceId',
  otherKey: 'professionalId',
  as: 'professionals',
});

Professional.hasMany(Availability, { foreignKey: 'professionalId', as: 'availabilities' });
Availability.belongsTo(Professional, { foreignKey: 'professionalId', as: 'professional' });

Professional.hasMany(AvailabilityException, { foreignKey: 'professionalId', as: 'availabilityExceptions' });
AvailabilityException.belongsTo(Professional, { foreignKey: 'professionalId', as: 'professional' });

User.hasMany(Appointment, { foreignKey: 'clientId', as: 'appointmentsAsClient' });
Appointment.belongsTo(User, { foreignKey: 'clientId', as: 'client' });

Professional.hasMany(Appointment, { foreignKey: 'professionalId', as: 'appointments' });
Appointment.belongsTo(Professional, { foreignKey: 'professionalId', as: 'professional' });

Service.hasMany(Appointment, { foreignKey: 'serviceId', as: 'appointments' });
Appointment.belongsTo(Service, { foreignKey: 'serviceId', as: 'service' });

User.hasMany(ClinicalRecord, { foreignKey: 'patientId', as: 'clinicalRecords' });
ClinicalRecord.belongsTo(User, { foreignKey: 'patientId', as: 'patient' });

Professional.hasMany(ClinicalRecord, { foreignKey: 'professionalId', as: 'clinicalRecords' });
ClinicalRecord.belongsTo(Professional, { foreignKey: 'professionalId', as: 'professional' });

User.hasMany(SupportRequest, { foreignKey: 'userId', as: 'supportRequests' });
SupportRequest.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export {
  sequelize,
  User,
  Professional,
  Service,
  ProfessionalService,
  Availability,
  AvailabilityException,
  Appointment,
  ClinicalRecord,
  SupportRequest,
};
