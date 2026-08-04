import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  ArrowRight,
  Bell,
  Calendar,
  Check,
  Clock,
  CreditCard,
  FileText,
  Mail,
  MapPin,
  Phone,
  Plus,
  Smile,
  Star,
  Users,
} from 'lucide-react';
import * as professionalsApi from '../api/professionals';
import * as servicesApi from '../api/services';
import avatarJorgeP from '../assets/landing/avatar-jorge-p.jpg';
import avatarMariaL from '../assets/landing/avatar-maria-l.jpg';
import avatarSofiaR from '../assets/landing/avatar-sofia-r.jpg';
import blanqueamientoDental from '../assets/landing/blanqueamiento-dental.jpg';
import cirugiaMuelaJuicio from '../assets/landing/cirugia-muela-juicio.jpg';
import colocacionBrackets from '../assets/landing/colocacion-brackets.jpg';
import heroClinica from '../assets/landing/hero-clinica.jpg';
import proCarlaFernandez from '../assets/landing/pro-carla-fernandez.jpg';
import proMartinAguirre from '../assets/landing/pro-martin-aguirre.jpg';
import proNicolasParedes from '../assets/landing/pro-nicolas-paredes.jpg';
import proValentinaRojas from '../assets/landing/pro-valentina-rojas.jpg';
import { ImagePlaceholder } from '../components/landing/ImagePlaceholder';
import { formatMoney } from '../lib/format';
import { useAuthStore } from '../stores/authStore';
import type { Professional, Service } from '../types';

const WHY_CARDS = [
  {
    icon: Calendar,
    title: 'Turnos online 24/7',
    text: 'Reservá desde el celular a cualquier hora. Ves solo horarios realmente disponibles.',
  },
  {
    icon: Users,
    title: 'Elegís tu profesional',
    text: 'Conocé al equipo y reservá con el especialista de tu confianza.',
  },
  {
    icon: Bell,
    title: 'Recordatorios',
    text: 'Te avisamos antes de tu turno para que no se te pase. Reprogramás en un clic.',
  },
  {
    icon: FileText,
    title: 'Tu historia clínica',
    text: 'Tus tratamientos y controles quedan registrados para tu seguimiento.',
  },
  {
    icon: Clock,
    title: 'Cancelación flexible',
    text: 'Cancelá o reprogramá hasta 24hs antes, sin llamar a la clínica.',
  },
  {
    icon: CreditCard,
    title: 'Pagos claros',
    text: 'Conocé el precio de cada servicio antes de reservar. Sin sorpresas.',
  },
];

const TESTIMONIALS = [
  {
    name: 'María L.',
    role: 'Paciente',
    quote: 'Saqué el turno un domingo a la noche en un minuto. Sin llamar, sin esperar. Excelente atención.',
    avatar: avatarMariaL,
  },
  {
    name: 'Jorge P.',
    role: 'Paciente',
    quote: 'Pude elegir a mi odontóloga de siempre y ver sus horarios libres al toque. Muy cómodo.',
    avatar: avatarJorgeP,
  },
  {
    name: 'Sofía R.',
    role: 'Paciente',
    quote: 'Me llegó el recordatorio y pude reprogramar sin problema. La clínica es impecable.',
    avatar: avatarSofiaR,
  },
];

const FAQS = [
  {
    q: '¿Cómo saco un turno?',
    a: 'Registrate, elegí profesional y servicio, y seleccioná un horario disponible. La confirmación es inmediata.',
  },
  {
    q: '¿Puedo cancelar o reprogramar?',
    a: 'Podés cancelar tu turno hasta 24hs antes desde "Mis turnos". Para reprogramar, cancelá y reservá un nuevo horario.',
  },
  { q: '¿Atienden obras sociales?', a: 'Consultá con recepción qué obras sociales aceptamos para cada tratamiento.' },
  {
    q: '¿Necesito crear una cuenta?',
    a: 'Sí, un registro rápido con tu nombre, email y teléfono para poder gestionar tus turnos.',
  },
];

const primaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-[#5847eb] px-7 py-[15px] text-[15.5px] font-bold text-white shadow-[0_12px_26px_rgba(88,71,235,.32)] transition hover:bg-[#4736c4]';
/** Botón secundario translúcido, para usar sobre fondos oscuros/fotos (hero, CTA final). */
const secondaryBtnOnDark =
  'inline-flex items-center justify-center rounded-xl border-[1.5px] border-white/35 bg-white/[0.14] px-7 py-[15px] text-[15.5px] font-bold text-white transition hover:bg-white/25';

/** Centra y limita el contenido a 1200px dentro de una sección full-bleed (que es la que lleva el color de fondo). */
const inner = 'mx-auto max-w-[1200px] px-6 sm:px-10';

/** Fotos reales ya generadas, matcheadas por nombre de servicio. El resto sigue con el placeholder rayado. */
const SERVICE_IMAGES: Record<string, string> = {
  'Blanqueamiento dental': blanqueamientoDental,
  'Cirugía de muela de juicio': cirugiaMuelaJuicio,
  'Colocación de brackets': colocacionBrackets,
};

/** Fotos reales ya generadas, matcheadas por nombre de profesional. El resto sigue con el placeholder rayado. */
const PROFESSIONAL_IMAGES: Record<string, string> = {
  'Valentina Rojas': proValentinaRojas,
  'Martín Aguirre': proMartinAguirre,
  'Carla Fernández': proCarlaFernandez,
  'Nicolás Paredes': proNicolasParedes,
};

export function LandingPage() {
  const user = useAuthStore((s) => s.user);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    servicesApi.list().then(setServices).catch(() => {});
    professionalsApi.list().then(setProfessionals).catch(() => {});
  }, []);

  if (user) {
    return <Navigate to="/inicio" replace />;
  }

  const featuredServices = services.slice(0, 3);
  const featuredProfessionals = professionals.slice(0, 4);

  return (
    <div className="min-h-screen bg-white font-sans text-[#1a1830]">
      {/* barra utilitaria */}
      <div className="bg-[#15132b] py-[9px] text-[12.5px] font-semibold text-[#c9c6dd]">
        <div className={`${inner} flex flex-wrap items-center justify-between gap-2`}>
          <div className="flex gap-6">
            <span className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" /> (011) 4000-0000
            </span>
            <span className="hidden items-center gap-1.5 sm:flex">
              <MapPin className="h-3.5 w-3.5" /> Av. Corrientes 1234, CABA
            </span>
          </div>
          <div className="flex gap-6">
            <span className="hidden items-center gap-1.5 sm:flex">
              <Clock className="h-3.5 w-3.5" /> Lun a Vie 9–20 · Sáb 9–13
            </span>
            <span className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" /> turnos@sonrisas.com
            </span>
          </div>
        </div>
      </div>

      {/* navbar */}
      <nav id="inicio" className="border-b border-[rgba(26,24,48,.07)] py-[18px]">
        <div className={`${inner} flex items-center justify-between gap-4`}>
          <div className="flex items-center gap-[11px]">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5847eb] text-white shadow-[0_6px_16px_rgba(88,71,235,.35)]">
              <Smile className="h-5 w-5" />
            </span>
            <div className="hidden flex-col leading-[1.05] sm:flex">
              <span className="text-[16px] font-extrabold tracking-[-.3px]">Clínica Dental Sonrisas</span>
              <span className="text-[10px] font-medium tracking-[.2px] text-[#8a879c]">ODONTOLOGÍA INTEGRAL</span>
            </div>
          </div>
          <div className="hidden items-center gap-7 lg:flex">
            <a href="#inicio" className="text-sm font-semibold text-[#4a4860] hover:text-[#5847eb]">
              Inicio
            </a>
            <a href="#servicios" className="text-sm font-semibold text-[#4a4860] hover:text-[#5847eb]">
              Servicios
            </a>
            <a href="#profesionales" className="text-sm font-semibold text-[#4a4860] hover:text-[#5847eb]">
              Profesionales
            </a>
            <a href="#contacto" className="text-sm font-semibold text-[#4a4860] hover:text-[#5847eb]">
              Contacto
            </a>
          </div>
          <div className="flex items-center gap-3.5">
            <Link to="/login" className="text-sm font-bold text-[#1a1830] hover:text-[#5847eb]">
              Ingresar
            </Link>
            <Link
              to="/acceso"
              className="rounded-[10px] bg-[#5847eb] px-5 py-[11px] text-sm font-bold text-white shadow-[0_8px_18px_rgba(88,71,235,.28)] hover:bg-[#4736c4]"
            >
              Reservar turno
            </Link>
          </div>
        </div>
      </nav>

      {/* hero: foto de fondo a pantalla completa, texto superpuesto (en vez del widget de reserva mockeado
          que había antes — confundía, parecía interactivo pero no lo era) */}
      <div className="relative min-h-[560px] overflow-hidden bg-[#15132b] lg:min-h-[640px]">
        <img src={heroClinica} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d0b1f]/90 via-[#0d0b1f]/60 to-[#0d0b1f]/15" />
        <div className={`${inner} relative flex min-h-[560px] items-center py-16 lg:min-h-[640px]`}>
          <div className="max-w-[560px]">
            <div className="mb-[22px] inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-[7px] text-[12.5px] font-bold text-white backdrop-blur-sm">
              <Smile className="h-4 w-4" /> Odontología integral en CABA
            </div>
            <h1 className="m-0 mb-5 text-[36px] leading-[1.08] font-extrabold tracking-[-1px] text-white sm:text-[42px] lg:text-[50px] lg:leading-[1.05] lg:tracking-[-1.5px]">
              Tu sonrisa, <span className="text-[#b9aefc]">en las mejores manos</span>
            </h1>
            <p className="m-0 mb-8 text-lg leading-[1.6] text-white/85">
              Sacá tu turno online eligiendo profesional, servicio y horario disponible. Sin llamados, sin esperas,
              con confirmación al instante.
            </p>
            <div className="mb-[34px] flex flex-wrap gap-3.5">
              <Link to="/acceso" className={primaryBtn}>
                Reservar turno <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/login" className={secondaryBtnOnDark}>
                Ya soy paciente
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-[22px] text-[13px] font-semibold text-white/75">
              <span className="flex items-center gap-[7px]">
                <Check className="h-[15px] w-[15px] text-[#b9aefc]" /> +20 años de experiencia
              </span>
              <span className="flex items-center gap-[7px]">
                <Check className="h-[15px] w-[15px] text-[#b9aefc]" /> 8 especialistas
              </span>
              <span className="flex items-center gap-[7px]">
                <Check className="h-[15px] w-[15px] text-[#b9aefc]" /> Obras sociales
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* banda de stats */}
      <div className="bg-[#1a1830] py-[38px] text-white">
        <div className={`${inner} grid grid-cols-2 gap-5 lg:grid-cols-4`}>
          <div className="text-center">
            <div className="text-[34px] font-extrabold tracking-[-1px]">+20</div>
            <div className="mt-1 text-[13px] font-semibold text-[#b3b0c8]">años de experiencia</div>
          </div>
          <div className="border-l border-white/10 text-center">
            <div className="text-[34px] font-extrabold tracking-[-1px] text-[#b9aefc]">8</div>
            <div className="mt-1 text-[13px] font-semibold text-[#b3b0c8]">especialistas</div>
          </div>
          <div className="border-l border-white/10 text-center">
            <div className="text-[34px] font-extrabold tracking-[-1px]">+15.000</div>
            <div className="mt-1 text-[13px] font-semibold text-[#b3b0c8]">pacientes atendidos</div>
          </div>
          <div className="border-l border-white/10 text-center">
            <div className="text-[34px] font-extrabold tracking-[-1px] text-[#b9aefc]">4.9★</div>
            <div className="mt-1 text-[13px] font-semibold text-[#b3b0c8]">satisfacción</div>
          </div>
        </div>
      </div>

      {/* por qué elegirnos */}
      <div className="py-[70px]">
        <div className={inner}>
          <div className="mx-auto mb-[46px] max-w-[620px] text-center">
            <div className="mb-3 text-[13px] font-bold tracking-[.6px] text-[#5847eb] uppercase">
              Por qué elegirnos
            </div>
            <h2 className="m-0 mb-3.5 text-[32px] font-extrabold tracking-[-1px] sm:text-[38px]">
              Una clínica pensada para vos
            </h2>
            <p className="m-0 text-[17px] leading-[1.6] text-[#5a5872]">
              Atención de calidad y la comodidad de gestionar tus turnos por internet, cuando quieras.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-[22px] sm:grid-cols-2 lg:grid-cols-3">
            {WHY_CARDS.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-[rgba(26,24,48,.09)] bg-[#faf9ff] p-[26px]">
                <span className="mb-4 flex h-[46px] w-[46px] items-center justify-center rounded-xl bg-[#ece9ff] text-[#5847eb]">
                  <Icon className="h-[22px] w-[22px]" />
                </span>
                <div className="mb-2 text-lg font-extrabold">{title}</div>
                <p className="m-0 text-[14.5px] leading-[1.55] text-[#5a5872]">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* servicios */}
      <div id="servicios" className="border-t border-[rgba(26,24,48,.07)] bg-[#faf9ff] py-[66px]">
        <div className={inner}>
          <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="mb-3 text-[13px] font-bold tracking-[.6px] text-[#5847eb] uppercase">Servicios</div>
              <h2 className="m-0 text-[30px] font-extrabold tracking-[-1px] sm:text-[36px]">Tratamientos y precios</h2>
            </div>
            <Link to="/acceso" className="text-[14.5px] font-bold text-[#5847eb] hover:underline">
              Ver todos →
            </Link>
          </div>
          {featuredServices.length > 0 ? (
            <div className="grid grid-cols-1 gap-[22px] sm:grid-cols-2 lg:grid-cols-3">
              {featuredServices.map((service) => (
                <div key={service.id} className="overflow-hidden rounded-2xl border border-[rgba(26,24,48,.09)] bg-white">
                  {SERVICE_IMAGES[service.name] ? (
                    <img
                      src={SERVICE_IMAGES[service.name]}
                      alt={service.name}
                      className="h-[120px] w-full object-cover"
                    />
                  ) : (
                    <ImagePlaceholder label={`foto: ${service.name.toLowerCase()}`} className="h-[120px] w-full" />
                  )}
                  <div className="p-[22px]">
                    <div className="mb-1.5 text-lg font-extrabold">{service.name}</div>
                    <p className="m-0 mb-4 text-[13.5px] leading-[1.5] text-[#5a5872]">
                      {service.description ?? 'Atención profesional y personalizada.'}
                    </p>
                    <div className="flex items-center justify-between border-t border-[rgba(26,24,48,.08)] pt-3.5">
                      <span className="flex items-center gap-1.5 text-[13px] font-semibold text-[#8a879c]">
                        <Clock className="h-3.5 w-3.5" /> {service.durationMinutes} min
                      </span>
                      <span className="text-[19px] font-extrabold text-[#5847eb]">{formatMoney(service.price)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#8a879c]">Cargando servicios…</p>
          )}
        </div>
      </div>

      {/* profesionales */}
      <div id="profesionales" className="py-[70px]">
        <div className={inner}>
          <div className="mx-auto mb-[46px] max-w-[620px] text-center">
            <div className="mb-3 text-[13px] font-bold tracking-[.6px] text-[#5847eb] uppercase">Nuestro equipo</div>
            <h2 className="m-0 mb-3.5 text-[32px] font-extrabold tracking-[-1px] sm:text-[38px]">
              Profesionales que te cuidan
            </h2>
            <p className="m-0 text-[17px] leading-[1.6] text-[#5a5872]">
              Especialistas con años de trayectoria. Elegí con quién querés atenderte al reservar.
            </p>
          </div>
          {featuredProfessionals.length > 0 ? (
            <div className="grid grid-cols-2 gap-[22px] lg:grid-cols-4">
              {featuredProfessionals.map((professional) => (
                <div key={professional.id} className="text-center">
                  {PROFESSIONAL_IMAGES[professional.user.name] ? (
                    <img
                      src={PROFESSIONAL_IMAGES[professional.user.name]}
                      alt={professional.user.name}
                      className="mb-3.5 h-[200px] w-full rounded-2xl object-cover"
                    />
                  ) : (
                    <ImagePlaceholder label="foto profesional" radius="lg" className="mb-3.5 h-[200px] w-full" />
                  )}
                  <div className="text-[16px] font-extrabold">{professional.user.name}</div>
                  <div className="my-[3px] text-[13px] font-bold text-[#5847eb]">
                    {professional.specialty ?? 'Odontología general'}
                  </div>
                  <Link
                    to="/acceso"
                    className="inline-block rounded-lg border-[1.5px] border-[rgba(26,24,48,.14)] px-4 py-2 text-[13px] font-bold text-[#1a1830] hover:border-[#5847eb] hover:text-[#5847eb]"
                  >
                    Reservar
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-[#8a879c]">Cargando profesionales…</p>
          )}
        </div>
      </div>

      {/* testimonios */}
      <div className="border-t border-[rgba(26,24,48,.07)] bg-[#faf9ff] py-[66px]">
        <div className={inner}>
          <div className="mb-11 text-center">
            <div className="mb-3 text-[13px] font-bold tracking-[.6px] text-[#5847eb] uppercase">Opiniones</div>
            <h2 className="m-0 text-[30px] font-extrabold tracking-[-1px] sm:text-[36px]">
              Lo que dicen nuestros pacientes
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-[22px] lg:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="rounded-2xl border border-[rgba(26,24,48,.09)] bg-white p-7">
                <div className="mb-3.5 flex gap-0.5 text-[#f5a623]">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-[15px] w-[15px] fill-current" />
                  ))}
                </div>
                <p className="m-0 mb-5 text-[15px] leading-[1.6] text-[#3a3852]">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  {t.avatar ? (
                    <img src={t.avatar} alt={t.name} className="h-[42px] w-[42px] rounded-full object-cover" />
                  ) : (
                    <ImagePlaceholder label="" radius="full" className="h-[42px] w-[42px]" />
                  )}
                  <div>
                    <div className="text-sm font-extrabold">{t.name}</div>
                    <div className="text-xs font-semibold text-[#8a879c]">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="py-[66px]">
        <div className={inner}>
          <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[0.9fr_1.3fr]">
            <div>
              <div className="mb-3 text-[13px] font-bold tracking-[.6px] text-[#5847eb] uppercase">
                Preguntas frecuentes
              </div>
              <h2 className="m-0 mb-4 text-[28px] font-extrabold tracking-[-1px] sm:text-[34px]">
                ¿Dudas antes de reservar?
              </h2>
              <p className="m-0 mb-[22px] text-[15.5px] leading-[1.6] text-[#5a5872]">
                Escribinos y te respondemos a la brevedad.
              </p>
              <a
                href="#contacto"
                className="inline-block rounded-[11px] bg-[#5847eb] px-[22px] py-[13px] text-[14.5px] font-bold text-white hover:bg-[#4736c4]"
              >
                Contactar a la clínica
              </a>
            </div>
            <div className="flex flex-col gap-3">
              {FAQS.map((item, i) => {
                const isOpen = openFaq === i;
                return (
                  <div key={item.q} className="rounded-[13px] border border-[rgba(26,24,48,.09)] px-[22px] py-[18px]">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? -1 : i)}
                      className="flex w-full items-center justify-between text-left text-[15.5px] font-bold"
                    >
                      {item.q}
                      <Plus
                        className={`h-4 w-4 shrink-0 transition-transform ${
                          isOpen ? 'rotate-45 text-[#5847eb]' : 'text-[#8a879c]'
                        }`}
                      />
                    </button>
                    {isOpen && <p className="m-0 mt-3 text-sm leading-[1.55] text-[#5a5872]">{item.a}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* CTA final */}
      <div className="bg-[#5847eb] py-[60px] text-center text-white">
        <div className={inner}>
          <h2 className="m-0 mb-3.5 text-[28px] font-extrabold tracking-[-1px] sm:text-[36px]">
            Reservá tu turno hoy mismo
          </h2>
          <p className="m-0 mb-[30px] text-[17px] text-[#e0dcff]">
            Sin llamados, sin esperas. Tu próxima visita a un clic.
          </p>
          <div className="flex flex-wrap justify-center gap-3.5">
            <Link
              to="/acceso"
              className="rounded-xl bg-white px-[30px] py-[15px] text-[15.5px] font-extrabold text-[#5847eb] hover:bg-white/90"
            >
              Reservar turno
            </Link>
            <Link to="/login" className={secondaryBtnOnDark}>
              Ya soy paciente
            </Link>
          </div>
        </div>
      </div>

      {/* footer */}
      <footer id="contacto" className="bg-[#15132b] py-11 text-[#b3b0c8]">
        <div className={`${inner} grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]`}>
          <div>
            <div className="mb-3.5 flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-[#5847eb] text-white">
                <Smile className="h-4 w-4" />
              </span>
              <span className="text-[15px] font-extrabold text-white">Clínica Dental Sonrisas</span>
            </div>
            <p className="m-0 max-w-[240px] text-[13px] leading-[1.6]">
              Odontología integral en el corazón de Buenos Aires. Cuidamos tu sonrisa desde hace más de 20 años.
            </p>
          </div>
          <div>
            <div className="mb-3.5 text-xs font-extrabold tracking-[.5px] text-white uppercase">Clínica</div>
            <div className="flex flex-col gap-2.5 text-[13.5px]">
              <a href="#servicios" className="hover:text-white">
                Servicios
              </a>
              <a href="#profesionales" className="hover:text-white">
                Profesionales
              </a>
              <Link to="/acceso" className="hover:text-white">
                Reservar turno
              </Link>
            </div>
          </div>
          <div>
            <div className="mb-3.5 text-xs font-extrabold tracking-[.5px] text-white uppercase">Horarios</div>
            <div className="flex flex-col gap-2.5 text-[13.5px]">
              <span>Lun a Vie · 9 a 20 hs</span>
              <span>Sábados · 9 a 13 hs</span>
              <span>Domingos · cerrado</span>
            </div>
          </div>
          <div>
            <div className="mb-3.5 text-xs font-extrabold tracking-[.5px] text-white uppercase">Contacto</div>
            <div className="flex flex-col gap-2.5 text-[13.5px]">
              <span className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" /> (011) 4000-0000
              </span>
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> turnos@sonrisas.com
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> Av. Corrientes 1234, CABA
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
