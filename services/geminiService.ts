import { GoogleGenAI, Type } from "@google/genai";

// Esta función ahora espera la clave API como un argumento.
export const getGenAIClient = (apiKey: string) => {
  if (!apiKey || apiKey.trim() === '') {
    // Este error será capturado por el componente App y se mostrará al usuario.
    throw new Error("Clave de API de Gemini no proporcionada. Por favor, introdúcela en el campo de configuración.");
  }
  
  return new GoogleGenAI({ apiKey });
};

// Nueva función para verificar la validez de una clave de API
export const verifyApiKey = async (apiKey: string): Promise<boolean> => {
  if (!apiKey) {
    throw new Error("La clave de API no puede estar vacía.");
  }
  try {
    const aiClient = new GoogleGenAI({ apiKey });
    // Hacemos una llamada muy simple y de bajo costo para verificar la clave
    await aiClient.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "test",
    });
    return true;
  } catch (error) {
     console.error("API Key validation error:", error);
     throw new Error("La clave de API proporcionada no es válida o no tiene los permisos necesarios.");
  }
};


export type GeneratedParts = {
  asunto_mejorado: string;
  palabras_presidente: string;
  acuerdos: string[];
};

export const generateMeetingMinutesContent = async (aiClient: GoogleGenAI, asunto: string, asistentes: string[]): Promise<GeneratedParts> => {
  try {
    const prompt = `
      Eres un asistente experto en la redacción de actas de cabildo para el ayuntamiento de Tepakán, Yucatán, México.
      Tu tarea es tomar un asunto general y expandirlo en un texto profesional y muy detallado para un acta de cabildo. La clave es el DETALLE.

      Reglas y Contexto Crucial sobre el Municipio de Tepakán:
      1.  **SIN CATASTRO:** El ayuntamiento de Tepakán es una entidad pequeña y NO cuenta con un departamento de catastro. Bajo ninguna circunstancia menciones el catastro o temas relacionados.
      2.  **DEPARTAMENTOS LIMITADOS:** Limítate a mencionar departamentos básicos como Obras Públicas, Servicios Públicos, Tesorería y Policía Municipal. No inventes departamentos complejos.
      3.  **TONO FORMAL:** Mantén un tono estrictamente formal, legal y apegado a la terminología usada en la administración pública de Yucatán.
      4.  **EVITA SUPOSICIONES:** No hagas suposiciones sobre proyectos, presupuestos o situaciones del municipio que no estén explícitamente en el "Asunto en cartera". Basa tu respuesta únicamente en los datos proporcionados.

      Datos de la sesión:
      - Asunto en cartera a desarrollar: "${asunto}"
      - Asistentes presentes: ${asistentes.join(', ')}

      Realiza las siguientes 3 tareas con un alto nivel de detalle:
      1.  **Mejora el Asunto**: Reformula el "Asunto en cartera" en un texto más formal y completo, adecuado para el punto 5 del orden del día.
      2.  **Genera las Palabras del Presidente**: Redacta una intervención del Presidente Municipal que sea breve y concisa, pero impactante. El discurso debe:
          - Ir directamente al punto, presentando el tema.
          - Explicar claramente la importancia y los beneficios de la propuesta para el municipio, sin extenderse innecesariamente.
          - Concluir con una invitación formal y directa a la deliberación y votación.
      3.  **Crea los Acuerdos Detallados**: Genera una lista de varios acuerdos específicos y bien definidos como conclusión de la discusión. Es crucial que:
          - Si el asunto principal se compone de varios temas o partes (por ejemplo, un reglamento con varios capítulos, o un plan con varias acciones), CADA TEMA DEBE TENER SU PROPIO PUNTO DE ACUERDO SEPARADO.
          - Genera un mínimo de 2 a 4 puntos de acuerdo, a menos que el tema sea extremadamente simple.
          - Cada acuerdo debe ser claro, conciso y accionable.

      Devuelve una respuesta en formato JSON con la siguiente estructura. No incluyas nada más que el objeto JSON:
    `;

    const response = await aiClient.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            asunto_mejorado: {
              type: Type.STRING,
              description: "El texto del asunto en cartera, mejorado y profesionalizado."
            },
            palabras_presidente: {
              type: Type.STRING,
              description: "La intervención breve y concisa del Presidente Municipal sobre el asunto."
            },
            acuerdos: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING
              },
              description: "Una lista detallada con el texto de cada acuerdo resultante, desglosado por subtema."
            },
          },
          required: ['asunto_mejorado', 'palabras_presidente', 'acuerdos'],
        },
      }
    });

    const text = response.text.trim();
    // A veces, la API puede devolver el JSON dentro de un bloque de código markdown.
    const cleanedText = text.replace(/^```json\s*|```$/g, '');
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error && (error.message.includes('API key not valid') || error.message.includes('API_KEY_INVALID'))) {
        throw new Error("API key not valid. Please verify your API key in the configuration.");
    }
    throw new Error("No se pudo generar el contenido con la IA. Revisa la consola para más detalles.");
  }
};