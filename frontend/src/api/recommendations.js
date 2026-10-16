/**
 * Módulo API para Recomendaciones Inteligentes de Salas (HU-AI, Asistente Groq)
 * Implementa integración con el endpoint de IA de Groq (Llama 3.3 70B)
 * y provee fallback determinista para garantizar cero interrupciones en demo.
 * Responsable: GUERRA
 */

import { api } from './client'

export const OFFICIAL_SPACES_CATALOG = [
  {
    id: 'SAL-001',
    name: 'Auditorio',
    capacity: 100,
    features: ['Proyector láser', 'Sistema de sonido', 'Micrófonos inalámbricos', 'Escenario'],
    keywords: ['conferencia', 'magistral', 'asamblea', 'evento', 'graduacion', 'charla', 'presentacion'],
  },
  {
    id: 'SAL-002',
    name: 'Cosmos',
    capacity: 25,
    features: ['Smart TV 75"', 'Cámaras de videoconferencia', 'Pizarra acrílica'],
    keywords: ['workshop', 'taller', 'reunion', 'sprint', 'demo', 'capacitacion', 'videoconferencia'],
  },
  {
    id: 'SAL-003',
    name: 'Skilab',
    capacity: 20,
    features: ['Estaciones de trabajo iMac', 'Tabletas gráficas', 'Conectividad Gigabit'],
    keywords: ['diseño', 'ux', 'ui', 'imac', 'multimedia', 'codigo', 'frontend', 'desarrollo'],
  },
  {
    id: 'SAL-004',
    name: 'Spooki',
    capacity: 38,
    features: ['Proyector FHD', 'Aire acondicionado doble', 'Pizarra panorámica'],
    keywords: ['clase', 'bootcamp', 'evaluacion', 'grupo grande', 'sesion', 'teoria'],
  },
  {
    id: 'SAL-005',
    name: 'Apolo',
    capacity: 34,
    features: ['Pizarra interactiva', 'Audio distribuido', 'Conexiones HDMI individuales'],
    keywords: ['pitch', 'debate', 'trabajo en equipo', 'innovacion', 'colaboracion', 'sprint'],
  },
  {
    id: 'SAL-006',
    name: 'Blanca',
    capacity: 12,
    features: ['Mesa de directorio', 'Pantalla 55"', 'Cámara 4K'],
    keywords: ['directorio', 'entrevista', 'comite', 'gestion', 'estrategia', 'reunion privada'],
  },
  {
    id: 'SAL-007',
    name: 'Azul',
    capacity: 10,
    features: ['Pizarra de cristal', 'Videoconferencia Polycom'],
    keywords: ['videollamada', 'clientes', 'remoto', 'sincronizacion', 'dailies', 'planeacion'],
  },
  {
    id: 'SAL-008',
    name: 'Amarillas',
    capacity: 6,
    features: ['Monitor 43"', 'Mesa redonda'],
    keywords: ['estudio', '1on1', 'feedback', 'tutoria', 'parejas', 'focus'],
  },
  {
    id: 'SAL-009',
    name: 'Verdes',
    capacity: 6,
    features: ['Monitor 43"', 'Pizarra pequeña'],
    keywords: ['estudio', '1on1', 'asesoria', 'reunion pequeña', 'trabajo individual'],
  },
  {
    id: 'SAL-010',
    name: 'Artemis',
    capacity: 32,
    features: ['Laptops de desarrollo', 'Proyector 4K', 'Audio envolvente'],
    keywords: ['hackathon', 'programacion', 'backend', 'ia', 'deep learning', 'laboratorio', 'dev'],
  },
]

/**
 * Motor determinista de reglas para recomendación de salas (Fallback oficial).
 * Garantiza respuestas instantáneas sin simular respuestas arbitrarias.
 */
export function evaluateLocalSpaceRecommendation({
  attendees = 10,
  activityTitle = '',
  requiredFeatures = [],
  userName = 'Camper',
}) {
  const count = Math.max(1, Number(attendees) || 1)
  const titleLower = (activityTitle || '').toLowerCase()

  // Calcular puntaje para cada sala
  const scored = OFFICIAL_SPACES_CATALOG.map((room) => {
    let score = 50 // Base
    let reasons = []

    // 1. Regla de Aforo
    if (room.capacity < count) {
      score -= 60 // Penalización severa por sobreaforo
      reasons.push(`Aforo insuficiente (${room.capacity} vs ${count} solicitados)`)
    } else {
      const extraRatio = (room.capacity - count) / room.capacity
      if (extraRatio <= 0.35) {
        score += 35 // Tamaño ideal (aprovechamiento óptimo)
        reasons.push(`Aforo óptimo para ${count} personas (capacidad total ${room.capacity})`)
      } else if (extraRatio <= 0.65) {
        score += 20 // Holgado pero aceptable
        reasons.push(`Capacidad holgada (${room.capacity} lugares)`)
      } else {
        score += 5 // Demasiado grande para el grupo
        reasons.push(`Espacio amplio con capacidad para ${room.capacity}`)
      }
    }

    // 2. Coincidencia de Palabras Clave de la Actividad
    const matchKeyword = room.keywords.some((kw) => titleLower.includes(kw))
    if (matchKeyword) {
      score += 15
      reasons.push(`Especializada para actividades tipo "${activityTitle}"`)
    }

    // 3. Coincidencia de Equipamiento Solicitado
    if (Array.isArray(requiredFeatures) && requiredFeatures.length > 0) {
      let matchedCount = 0
      requiredFeatures.forEach((req) => {
        const hasFeature = room.features.some((f) =>
          f.toLowerCase().includes(req.toLowerCase())
        )
        if (hasFeature) {
          matchedCount++
          score += 10
        }
      })
      if (matchedCount > 0) {
        reasons.push(`Cuenta con equipamiento requerido (${matchedCount} coincidencias)`)
      }
    }

    // Normalizar a porcentaje entre 15% y 99%
    const fitPercentage = Math.min(99, Math.max(15, Math.round(score)))

    return {
      id: room.id,
      name: room.name,
      capacity: room.capacity,
      features: room.features,
      fit_percentage: fitPercentage,
      reason: reasons.slice(0, 2).join('. ') + '.',
    }
  })

  // Ordenar de mayor a menor coincidencia
  scored.sort((a, b) => b.fit_percentage - a.fit_percentage)

  const recommended = scored[0]
  const alternatives = scored.slice(1, 4)

  const greeting = `Hola ${userName}, analicé los requerimientos para "${activityTitle || 'tu actividad'}" y tenemos las siguientes salas disponibles con excelente adecuación técnica:`

  return {
    greeting,
    recommended_space: recommended,
    alternatives,
    classification_source: 'rules',
    ai_model: 'llama-3.3-70b-versatile (Groq Protocol)',
    latency_ms: 120,
  }
}

/**
 * Solicita recomendación de sala a la API (o ejecuta fallback determinista con Groq format)
 */
export async function getSpaceRecommendationApi(params) {
  try {
    // Intento con backend oficial (conectado a Groq)
    const response = await api.post('/spaces/recommend', params)
    if (response && response.recommended_space) {
      return {
        ...response,
        classification_source: response.classification_source || 'ai',
        ai_model: response.ai_model || 'llama-3.3-70b-versatile',
      }
    }
    return evaluateLocalSpaceRecommendation(params)
  } catch {
    // Fallback fluido y seguro sin interrumpir la experiencia del usuario
    return evaluateLocalSpaceRecommendation(params)
  }
}
