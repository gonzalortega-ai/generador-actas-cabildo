import React, { useState, useCallback, useEffect } from 'react';
import { getGenAIClient, generateMeetingMinutesContent, GeneratedParts, verifyApiKey } from './services/geminiService';
import { generateDocx } from './utils/docxGenerator';
import { Header } from './components/Header';
import { InputField } from './components/InputField';
import { Button } from './components/Button';
import { DownloadIcon, SparklesIcon, PencilIcon, InfoIcon, CheckCircleIcon } from './components/Icons';
import { SelectField } from './components/SelectField';
import { InfoBanner } from './components/InfoBanner';

// --- Funciones de conversión a letras ---
const unidades = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
const decenas = ['', 'diez', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
const especiales = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
const centenas = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];
const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

function numeroALetras(n: number): string {
    if (n < 0) return '';
    if (n === 0) return 'cero';
    if (n < 10) return unidades[n];
    if (n < 20) return especiales[n - 10];
    if (n < 100) {
        const d = Math.floor(n / 10);
        const u = n % 10;
        if (u === 0) return decenas[d];
        if (d === 2 && u > 0) return `veinti${unidades[u]}`;
        return `${decenas[d]}${u > 0 ? ' y ' + unidades[u] : ''}`;
    }
    if (n < 1000) {
        const c = Math.floor(n / 100);
        const du = n % 100;
        if (du === 0) return n === 100 ? 'cien' : centenas[c];
        const cien = n === 100 ? 'cien' : centenas[c];
        return `${cien} ${numeroALetras(du)}`;
    }
    if (n < 2000) {
        return `mil ${numeroALetras(n % 1000)}`;
    }
     if (n < 1000000) {
        const miles = Math.floor(n / 1000);
        const resto = n % 1000;
        const milesStr = numeroALetras(miles) + ' mil';
        const restoStr = resto > 0 ? ' ' + numeroALetras(resto) : '';
        return `${milesStr}${restoStr}`;
    }
    return '';
}

export function convertirFechaHoraALetras(fecha: Date, hora: string): string {
    const [h, m] = hora.split(':').map(Number);
    
    const horaLetras = numeroALetras(h);
    const minutoLetras = m > 0 ? ` con ${numeroALetras(m)} minutos` : '';
    const diaLetras = numeroALetras(fecha.getUTCDate());
    const mesLetras = meses[fecha.getUTCMonth()];
    const anioLetras = numeroALetras(fecha.getUTCFullYear());

    const horaPlural = h === 1 ? 'hora' : 'horas';

    return `${horaLetras} ${horaPlural}${minutoLetras} del día ${diaLetras} de ${mesLetras} de ${anioLetras}`;
}

function convertirFechaALetrasHeader(fecha: Date): string {
    const diaLetras = numeroALetras(fecha.getUTCDate()).toUpperCase();
    const mesLetras = meses[fecha.getUTCMonth()].toUpperCase();
    const anioLetras = numeroALetras(fecha.getUTCFullYear()).toUpperCase();
    return `${diaLetras} DE ${mesLetras} DE ${anioLetras}.`;
}
// --- Fin de funciones de conversión ---

const defaultTemplate = `ACTA DE LA SESIÓN {{TIPO_SESION}} DE CABILDO. DEL
HONORABLE AYUNTAMIENTO DE TEPAKÁN,
YUCATÁN, 2024-2027, CELEBRADA EL DÍA
{{FECHA_HEADER_LETRAS}}

En el Municipio de Tepakán, Yucatán, Estados Unidos Mexicanos, siendo las {{FECHA_Y_HORA_EN_LETRAS}}, estando presentes en la sala de sesiones del Palacio Municipal, los integrantes del H. Ayuntamiento de Tepakán, Yucatán, Estados Unidos Mexicanos y presidiendo la sesión el C. Presidente Municipal, Rogel Ismael Gamboa Castillo, se procede a dar inicio a la {{TIPO_SESION}} de Cabildo, con fundamento en los artículos 30,31,32,33,34,64 y demás relativos de la Ley de Gobierno de los Municipios del Estado de Yucatán, con sujeción al siguiente orden del día:

1.- Lista de asistencia.
2.- Declaración de la existencia del quórum legal e instalación de la sesión.
3.- Aprobación del orden del día.
4.- Lectura de acta anterior.
5.- Asuntos en cartera: {{TEMA_DE_LA_SESION}}
6.- Clausura de la sesión.

En Cumplimiento del Primer Punto, el Secretario Municipal procedió al pase de lista:

{{ASISTENCIA_TABLE}}

Seguidamente, para desahogo del Segundo Punto el C. Presidente Municipal, declaró la existencia del quórum legal para realizar la presente sesión, toda vez que se encuentran todos los regidores presentes que integran el Honorable Cabildo.

Cumpliendo el Tercer Punto, De igual forma, se sometió a consideración y aprobación del Cabildo el orden del día, aprobándose por unanimidad de los Regidores presentes.

Cumplidos los tres primeros puntos del orden del día y como Cuarto Punto, se procedió a dar lectura del acta anterior y en ese punto el Secretario Municipal, C. Miguel Ángel Chi Uicab, propuso se dispense la lectura del acta anterior, toda vez que la misma es conocida por todos quienes en ella intervinieron, poniéndose a consideración del Cabildo, aprobándose por unanimidad de votos de los regidores presentes la dispensa de la lectura del acta anterior.

Expuestos y desahogados los cuatro primeros puntos del orden del día, para dar cumplimiento al Quinto Punto de la sesión, el Presidente Municipal, en uso de la voz, se dirigió a los regidores manifestando:
{{PALABRAS_PRESIDENTE}}
Acto seguido, puso a disposición de los presentes los documentos correspondientes.

Analizada la propuesta por los integrantes del Cabildo y no habiendo observaciones sobre el tema, se sometió a votación, resultando aprobado por UNANIMIDAD de votos de los regidores presentes.

ACUERDOS

{{ACUERDOS}}

Desahogando el punto cinco de la Orden del Día, se procede con el Sexto Punto.

CLAUSURA DE LA SESIÓN.

No habiendo otro asunto por tratar y habiéndose desahogado correctamente y en su totalidad todos los puntos de la Orden del Día y siendo las {{FECHA_Y_HORA_CIERRE_EN_LETRAS}}, se da por clausurada la presente Sesión. Levántese el Acta correspondiente.

Se firma la presente acta para constancia y validez por todos los Regidores que estuvieron presentes. Damos fe.

{{FIRMAS}}
`;

const initialAttendees = [
  { name: 'C. Rogel Ismael Gamboa Castillo', title: 'Presidente Municipal', attended: true },
  { name: 'C. Nelsi Margeli Chan Chan', title: 'Síndico Municipal', attended: true },
  { name: 'C. Miguel Angel Chi Uicab', title: 'Secretario Municipal', attended: true },
  { name: 'C. María Adela Canché Chable', title: 'Regidor', attended: true },
  { name: 'C. Wendy Abigail Estrella Tun', title: 'Regidora', attended: true },
];

const mesesOptions = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

type ActaType = 'general' | 'cuentaPublica';
type ApiKeyStatus = 'idle' | 'verifying' | 'valid' | 'invalid';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const [apiKeyStatus, setApiKeyStatus] = useState<ApiKeyStatus>('idle');
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);


  useEffect(() => {
    const savedApiKey = localStorage.getItem('gemini-api-key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
      setApiKeySaved(true);
      setApiKeyStatus('valid');
    }
  }, []);

  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    tipo_sesion: 'ORDINARIA',
  });
  const [horaInicio, setHoraInicio] = useState('10:00');
  const [horaCierre, setHoraCierre] = useState('11:30');
  const [asuntoEnCartera, setAsuntoEnCartera] = useState('Análisis y posible aprobación del nuevo reglamento de mercados.');
  const [attendees, setAttendees] = useState(initialAttendees);
  const [template, setTemplate] = useState(defaultTemplate);
  const [generatedContent, setGeneratedContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTemplateVisible, setIsTemplateVisible] = useState(false);
  const [actaType, setActaType] = useState<ActaType>('general');
  const [cuentaPublicaMonth, setCuentaPublicaMonth] = useState(new Date().getMonth());
  const [cuentaPublicaYear, setCuentaPublicaYear] = useState(new Date().getFullYear());

  const handleVerifyAndSaveApiKey = async () => {
    if (!apiKey) return;
    setApiKeyStatus('verifying');
    setApiKeyError(null);
    try {
      await verifyApiKey(apiKey);
      localStorage.setItem('gemini-api-key', apiKey);
      setApiKeySaved(true);
      setApiKeyStatus('valid');
    } catch (err) {
      localStorage.removeItem('gemini-api-key');
      setApiKeySaved(false);
      setApiKeyStatus('invalid');
      if (err instanceof Error) {
        setApiKeyError(err.message);
      } else {
        setApiKeyError('Ocurrió un error desconocido durante la verificación.');
      }
    }
  };

  const generateCuentaPublicaContent = useCallback((monthIndex: number, year: number) => {
    const monthName = mesesOptions[monthIndex].toUpperCase();
    const presentes = attendees.filter(a => a.attended).length;
    const totalMiembros = 5;

    let resultadoVotacion = '';
    let acuerdoVotacion = '';

    if (presentes === totalMiembros) {
      resultadoVotacion = 'UNANIMIDAD';
      acuerdoVotacion = 'unanimidad';
    } else if (presentes >= 4) {
      resultadoVotacion = 'MAYORÍA CALIFICADA';
      acuerdoVotacion = 'mayoría calificada';
    } else if (presentes >= 3) {
      resultadoVotacion = 'MAYORÍA ABSOLUTA';
      acuerdoVotacion = 'mayoría absoluta';
    } else {
      resultadoVotacion = 'MAYORÍA';
      acuerdoVotacion = 'mayoría';
    }
    
    let asunto = `Presentación y aprobación del Informe Mensual de la Cuenta Pública y en su caso la modificación al Presupuesto de Egresos correspondiente al mes de ${monthName} de ${year} del H. Ayuntamiento de Tepakán, Yucatán.`;
    let acuerdos = `PUNTO UNO. - Se aprueba por ${acuerdoVotacion} la Cuenta Pública, la modificación al Presupuesto de Egresos del mes de ${monthName.toLowerCase()} de ${year} del H. Ayuntamiento de Tepakán, Yucatán.\n\nPUNTO DOS. – Remítase el Informe Mensual correspondiente al mes de ${monthName.toLowerCase()} de ${year} a la Auditoría Superior del Estado de Yucatán.`;

    const monthNum = monthIndex + 1;
    if (monthNum % 3 === 0) { // Marzo, Junio, Septiembre, Diciembre
        const trimestres: { [key: number]: string } = {
            3: "Enero, Febrero y Marzo",
            6: "Abril, Mayo y Junio",
            9: "Julio, Agosto y Septiembre",
            12: "Octubre, Noviembre y Diciembre"
        };
        const trimestreText = ` y el Informe Trimestral correspondiente a los meses de ${trimestres[monthNum]}`;
        asunto = asunto.replace(' del H. ', `${trimestreText} del H. `);

        if (monthNum === 12) { // Diciembre
            asunto = asunto.replace(' del H. ', ` y el Informe Anual del H. `);
        }
    }
    
    const palabras_presidente = `“presento para su análisis, la Cuenta Pública Documentada y en su caso la modificación del Presupuesto de Egresos correspondiente al mes de ${monthName} de ${year} del H. Ayuntamiento de Tepakán, Yucatán. Acto seguido puso a disposición de los presentes los documentos correspondientes y explicó la situación y como se encuentra integrado.\nUna vez analizados por los integrantes del H. Cabildo de Tepakán, Yucatán, el presidente Municipal, en uso de la voz preguntó a los regidores “¿Hay alguna duda sobre los documentos presentados?”, a lo que los regidores respondieron que “No” y solicitó que los Regidores que Estén de acuerdo que se Apruebe el Otorgamiento del Documento mencionado levanten la mano. Levantándola ${presentes} de los ${totalMiembros} regidores presentes, quedando así aprobada por ${resultadoVotacion}.”`;

    return { asunto, palabras_presidente, acuerdos };
  }, [attendees]);

  useEffect(() => {
    if (actaType === 'cuentaPublica') {
      const { asunto } = generateCuentaPublicaContent(cuentaPublicaMonth, cuentaPublicaYear);
      setAsuntoEnCartera(asunto);
    } else {
      setAsuntoEnCartera('Análisis y posible aprobación del nuevo reglamento de mercados.');
    }
  }, [actaType, cuentaPublicaMonth, cuentaPublicaYear, generateCuentaPublicaContent]);


  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);
  
  const handleAttendeeChange = useCallback((index: number) => {
    setAttendees(currentAttendees =>
        currentAttendees.map((attendee, i) =>
            i === index ? { ...attendee, attended: !attendee.attended } : attendee
        )
    );
  }, []);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setGeneratedContent('');

    const attendingList = attendees
      .filter(a => a.attended)
      .map(a => `${a.name}, ${a.title}`);

    try {
      let palabras_presidente: string;
      let acuerdos_string: string;
      let asunto_final: string;
      let finalContent = template;

      if (actaType === 'cuentaPublica') {
        const content = generateCuentaPublicaContent(cuentaPublicaMonth, cuentaPublicaYear);
        palabras_presidente = content.palabras_presidente;
        acuerdos_string = content.acuerdos;
        asunto_final = content.asunto;
        
        finalContent = finalContent.replace(
          `Acto seguido, puso a disposición de los presentes los documentos correspondientes.\n\nAnalizada la propuesta por los integrantes del Cabildo y no habiendo observaciones sobre el tema, se sometió a votación, resultando aprobado por UNANIMIDAD de votos de los regidores presentes.`, 
          ''
        );
      } else {
        const aiClient = getGenAIClient(apiKey);
        const generatedParts: GeneratedParts = await generateMeetingMinutesContent(aiClient, asuntoEnCartera, attendingList);
        palabras_presidente = generatedParts.palabras_presidente;
        asunto_final = generatedParts.asunto_mejorado;
        
        const acuerdoPuntos = ["PUNTO UNO", "PUNTO DOS", "PUNTO TRES", "PUNTO CUATRO", "PUNTO CINCO"];
        acuerdos_string = generatedParts.acuerdos
            .map((acuerdo, index) => `${acuerdoPuntos[index] || `PUNTO ${numeroALetras(index+1).toUpperCase()}`}. - ${acuerdo}`)
            .join('\n\n');
      }
      
      const fechaObj = new Date(formData.fecha);
      const fechaYHoraInicioEnLetras = convertirFechaHoraALetras(fechaObj, horaInicio);
      const fechaYHoraCierreEnLetras = convertirFechaHoraALetras(fechaObj, horaCierre);
      const fechaHeaderLetras = convertirFechaALetrasHeader(fechaObj);

      const placeholders: { [key: string]: string } = {
        'TIPO_SESION': formData.tipo_sesion.toUpperCase(),
        'FECHA_HEADER_LETRAS': fechaHeaderLetras,
        'FECHA_Y_HORA_EN_LETRAS': fechaYHoraInicioEnLetras,
        'FECHA_Y_HORA_CIERRE_EN_LETRAS': fechaYHoraCierreEnLetras,
        'TEMA_DE_LA_SESION': asunto_final,
        'PALABRAS_PRESIDENTE': palabras_presidente,
        'ACUERDOS': acuerdos_string,
        'FIRMAS': '{{FIRMAS}}', // Keep placeholder for docx generator
        'ASISTENCIA_TABLE': '{{ASISTENCIA_TABLE}}', // Keep placeholder for docx generator
      };
      
      setAsuntoEnCartera(asunto_final);

      for (const key in placeholders) {
        finalContent = finalContent.replace(new RegExp(`{{${key}}}`, 'gi'), placeholders[key]);
      }

      setGeneratedContent(finalContent);
    } catch (err) {
      console.error(err);
      if (err instanceof Error) {
        if (err.message.includes("API key not valid")) {
          setError("La clave de API guardada parece no ser válida. Por favor, verifícala de nuevo en la configuración.");
          setApiKeyStatus('invalid');
          setApiKeySaved(false);
        } else {
          setError(err.message);
        }
      } else {
        setError('Ocurrió un error inesperado. Por favor, inténtalo de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDownload = () => {
    if (generatedContent) {
      const formattedDate = new Date().toISOString().split('T')[0];
      generateDocx(generatedContent, attendees, `Acta_Cabildo_Tepakan_${formattedDate}.docx`);
    }
  };
  
  const ApiKeyInfoBox = () => {
    const commonClasses = "p-4 rounded-md border-l-4 transition-colors duration-300";
    
    switch (apiKeyStatus) {
      case 'valid':
        return (
          <div className={`${commonClasses} bg-green-50 border-green-500`}>
            <h3 className="font-bold text-green-800 flex items-center"><CheckCircleIcon className="w-5 h-5 mr-2" />¡Clave Verificada y Guardada!</h3>
            <p className="text-sm text-green-700 mt-1">
              Tu clave de API está configurada correctamente. Ya puedes generar actas con IA.
            </p>
          </div>
        );
      case 'invalid':
        return (
          <div className={`${commonClasses} bg-red-50 border-red-500`}>
             <h3 className="font-bold text-red-800 flex items-center"><InfoIcon className="w-5 h-5 mr-2" />Error en la Clave de API</h3>
             <p className="text-sm text-red-700 mt-1">{apiKeyError}</p>
             <ApiKeyInputArea />
          </div>
        );
      default: // idle or verifying
        return (
            <div className={`${commonClasses} bg-amber-50 border-amber-400`}>
                <h3 className="font-bold text-amber-800 flex items-center"><InfoIcon className="w-5 h-5 mr-2" />Configuración de API Key de Gemini</h3>
                <p className="text-sm text-amber-700 mt-1">
                    Para usar la función de IA, introduce tu clave de API de Google Gemini.
                </p>
                <ApiKeyInputArea />
            </div>
        );
    }
  };

  const ApiKeyInputArea = () => (
    <div className="mt-3 flex items-center gap-2">
        <InputField 
            label="" 
            name="apiKey" 
            value={apiKey} 
            onChange={(e) => {
                setApiKey(e.target.value);
                setApiKeySaved(false);
                setApiKeyStatus('idle');
            }}
            type="text"
            placeholder="Pega tu clave de API aquí"
            className="flex-grow"
            disabled={apiKeyStatus === 'verifying'}
        />
        <Button onClick={handleVerifyAndSaveApiKey} disabled={!apiKey || apiKeyStatus === 'verifying'} className="py-2 px-4 text-sm w-40">
            {apiKeyStatus === 'verifying' ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              'Verificar y Guardar'
            )}
        </Button>
    </div>
  );


  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        <InfoBanner />
        <div className="space-y-8">
          
          <div className="bg-white p-6 rounded-xl shadow-lg space-y-6">
            <h2 className="text-2xl font-bold text-slate-700 border-b pb-2">Configuración y Datos de la Sesión</h2>
            
            <ApiKeyInfoBox />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <InputField label="Fecha" name="fecha" value={formData.fecha} onChange={handleInputChange} type="date" />
              <SelectField
                label="Tipo de Sesión"
                name="tipo_sesion"
                value={formData.tipo_sesion}
                onChange={handleInputChange}
                options={[
                  { value: 'ORDINARIA', label: 'Ordinaria' },
                  { value: 'EXTRAORDINARIA', label: 'Extraordinaria' },
                  { value: 'SOLEMNE', label: 'Solemne' },
                ]}
              />
              <InputField label="Hora de Inicio" name="hora_inicio" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} type="time" />
              <InputField label="Hora de Cierre" name="hora_cierre" value={horaCierre} onChange={(e) => setHoraCierre(e.target.value)} type="time" />
            </div>
            
            <h2 className="text-xl font-bold text-slate-700 pt-2">Asistentes</h2>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {attendees.map((attendee, index) => (
                <label key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-md border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                    <div>
                        <span className="font-medium text-slate-800">{attendee.name}</span>
                        <span className="block text-sm text-slate-500">{attendee.title}</span>
                    </div>
                    <input
                        type="checkbox"
                        checked={attendee.attended}
                        onChange={() => handleAttendeeChange(index)}
                        className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                </label>
              ))}
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">¿Qué tipo de acta quieres generar?</label>
                <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                        <input type="radio" name="actaType" value="general" checked={actaType === 'general'} onChange={() => setActaType('general')} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"/>
                        <span>Asunto General (Usa IA)</span>
                    </label>
                    <label className="flex items-center gap-2">
                        <input type="radio" name="actaType" value="cuentaPublica" checked={actaType === 'cuentaPublica'} onChange={() => setActaType('cuentaPublica')} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"/>
                        <span>Cuenta Pública (Automático)</span>
                    </label>
                </div>
            </div>

            {actaType === 'cuentaPublica' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <SelectField
                        label="Selecciona el Mes"
                        name="cuentaPublicaMonth"
                        value={cuentaPublicaMonth}
                        onChange={(e) => setCuentaPublicaMonth(parseInt(e.target.value, 10))}
                        options={mesesOptions.map((mes, index) => ({ value: index, label: mes }))}
                    />
                    <InputField
                        label="Año"
                        name="cuentaPublicaYear"
                        value={String(cuentaPublicaYear)}
                        onChange={(e) => setCuentaPublicaYear(parseInt(e.target.value, 10) || new Date().getFullYear())}
                    />
                </div>
            )}
            
            <h2 className="text-xl font-bold text-slate-700 pt-2">Asunto en Cartera (Punto 5)</h2>
            <InputField 
              label={actaType === 'general' ? "Describe aquí el tema principal que se discutirá." : "Asunto generado automáticamente."}
              name="asuntoEnCartera"
              value={asuntoEnCartera}
              onChange={(e) => setAsuntoEnCartera(e.target.value)}
              type="textarea"
              rows={4}
              readOnly={actaType === 'cuentaPublica'}
            />

            <div className="pt-2">
                <button 
                  onClick={() => setIsTemplateVisible(!isTemplateVisible)}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <PencilIcon className="w-4 h-4 mr-1" />
                  {isTemplateVisible ? 'Ocultar personalización de plantilla' : 'Personalización Avanzada de Plantilla'}
                </button>
            </div>

            {isTemplateVisible && (
                <div className="mt-2 p-4 bg-slate-50 rounded-lg border animate-fade-in">
                    <InputField label="Contenido de la Plantilla" name="template" value={template} onChange={(e) => setTemplate(e.target.value)} type="textarea" rows={15} className="font-mono text-sm" />
                </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-slate-700 border-b pb-2 mb-4">2. Generar y Previsualizar Acta</h2>
            
            <div className="mb-6">
              <Button onClick={handleGenerate} disabled={isLoading || (actaType === 'general' && !apiKeySaved)}>
                {isLoading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <SparklesIcon className="w-5 h-5 mr-2" />}
                {isLoading ? 'Generando...' : (actaType === 'cuentaPublica' ? 'Generar Acta' : 'Generar Acta con IA')}
              </Button>
               {actaType === 'general' && !apiKeySaved && (
                <p className="text-xs text-red-600 mt-2">
                  Por favor, verifica y guarda tu clave de API en la sección de configuración para poder generar actas con IA.
                </p>
              )}
            </div>

            {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert"><p className="font-bold">Error</p><p>{error}</p></div>}
            
            <div className="bg-slate-50 p-4 rounded-lg min-h-[600px] overflow-y-auto border">
              {generatedContent ? (
                <pre className="whitespace-pre-wrap font-serif text-sm leading-relaxed">{generatedContent.replace('{{FIRMAS}}', '\n\n... Firmas de los asistentes ...\n')}</pre>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400">
                  <p>El contenido del acta aparecerá aquí una vez generado.</p>
                </div>
              )}
            </div>

            <div className="pt-6">
              <Button onClick={handleDownload} disabled={!generatedContent || isLoading} variant="secondary">
                <DownloadIcon className="w-5 h-5 mr-2" />
                Descargar .docx
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;