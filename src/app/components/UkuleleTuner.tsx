'use client'

import React, { useState, useEffect, useRef } from 'react';

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext
  }
}

const UkuleleTuner = () => {
  const [pitch, setPitch] = useState<number>(0);
  const [note, setNote] = useState<string>('');
  const [deviation, setDeviation] = useState<number>(0);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  // Ukulelen kielet ja niiden taajuudet (G4, C4, E4, A4)
  const ukuleleStrings: Record<string, number> = {
    'G4': 392.00,
    'C4': 261.63,
    'E4': 329.63,
    'A4': 440.00
  };

  // Funktio lähimmän nuotin löytämiseen
  const findClosestNote = (frequency: number): { note: string; diff: number } => {
    let closestNote = '';
    let closestDiff = Infinity;
    let targetFreq = 0;

    Object.entries(ukuleleStrings).forEach(([note, noteFreq]) => {
      const diff = Math.abs(frequency - noteFreq);
      if (diff < closestDiff) {
        closestDiff = diff;
        closestNote = note;
        targetFreq = noteFreq;
      }
    });

    // Laske poikkeama sentteinä
    const cents = 1200 * Math.log2(frequency / targetFreq);
    setDeviation(cents);

    return { note: closestNote, diff: closestDiff };
  };

  const startListening = async () => {
    try {
      console.log('Tarkistetaan HTTPS...');
      if (!window.isSecureContext) {
        throw new Error('HTTPS_REQUIRED');
      }

      console.log('Tarkistetaan mikrofonin saatavuus...');
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Selain ei tue mikrofonia');
      }

      console.log('Pyydetään mikrofonilupaa...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      console.log('Mikrofoni saatu, luodaan AudioContext...');
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      
      console.log('Luodaan analyser...');
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      console.log('Luodaan MediaStreamSource...');
      mediaStreamSourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      
      console.log('Yhdistetään analyseriin...');
      mediaStreamSourceRef.current.connect(analyserRef.current);
      analyserRef.current.fftSize = 2048;
      
      console.log('Asetetaan tila...');
      setIsListening(true);
      setError('');
      
      // Tulostetaan audiolähteen tiedot
      const audioTracks = stream.getAudioTracks();
      console.log('Audioraidat:', audioTracks.map(track => ({
        label: track.label,
        enabled: track.enabled,
        muted: track.muted,
        readyState: track.readyState
      })));

      updatePitch();
    } catch (error) {
      console.error('Virhe mikrofonin käyttöönotossa:', error);
      
      if (!window.isSecureContext) {
        setError('Mikrofoni vaatii HTTPS-yhteyden toimiakseen.');
      } else if (error instanceof DOMException) {
        switch (error.name) {
          case 'NotAllowedError':
            setError('Mikrofonin käyttöä ei sallittu. Tarkista selaimen lupa-asetukset.');
            break;
          case 'NotFoundError':
            setError('Mikrofonia ei löydy. Tarkista että mikrofoni on kytketty ja toiminnassa.');
            break;
          case 'NotReadableError':
            setError('Mikrofonia ei voitu käyttää. Onko se ehkä jonkin muun sovelluksen käytössä?');
            break;
          default:
            setError(`Mikrofonin käyttöönotto epäonnistui: ${error.message}`);
        }
      } else {
        setError('Mikrofonin käyttöönotto epäonnistui tuntemattomasta syystä.');
      }
    }
  };

  const updatePitch = () => {
    if (!isListening || !analyserRef.current || !audioContextRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);
    analyserRef.current.getFloatTimeDomainData(dataArray);

    let maxCorrelation = 0;
    let foundPitch = 0;
    
    for (let lag = 0; lag < bufferLength/2; lag++) {
      let correlation = 0;
      
      for (let i = 0; i < bufferLength/2; i++) {
        correlation += dataArray[i] * dataArray[i + lag];
      }
      
      if (correlation > maxCorrelation) {
        maxCorrelation = correlation;
        foundPitch = audioContextRef.current.sampleRate / lag;
      }
    }

    if (foundPitch > 50 && foundPitch < 1000) {
      setPitch(foundPitch);
      const { note } = findClosestNote(foundPitch);
      setNote(note);
    }

    requestAnimationFrame(updatePitch);
  };

  const stopListening = () => {
    if (mediaStreamSourceRef.current) {
      mediaStreamSourceRef.current.disconnect();
      setIsListening(false);
    }
  };

  useEffect(() => {
    return () => {
      stopListening();
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close();
      }
    };
  }, []);

  // Apufunktio viritystilanteen värin määrittämiseen
  const getTuningColor = (cents: number): string => {
    if (Math.abs(cents) < 5) return 'bg-green-500';
    if (Math.abs(cents) < 15) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Apufunktio viritysohjeisiin
  const getTuningDirection = (cents: number): string => {
    if (Math.abs(cents) < 5) return 'Vireessä! 👍';
    if (cents > 0) return 'Löysää kieltä ⬇️';
    return 'Kiristä kieltä ⬆️';
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Ukulele Viritin</h2>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <button
          onClick={isListening ? stopListening : startListening}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {isListening ? 'Pysäytä' : 'Aloita viritys'}
        </button>

        {isListening && (
          <div className="text-center space-y-4">
            <div className="text-xl">
              <div>Havaittu kieli: <strong>{note}</strong></div>
              <div className="text-sm text-gray-600">
                Taajuus: {pitch.toFixed(1)} Hz
              </div>
            </div>

            <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`absolute h-full transition-all ${getTuningColor(deviation)}`}
                style={{ 
                  left: '50%',
                  width: '4px',
                  transform: `translateX(${Math.max(Math.min(deviation * 2, 50), -50)}px)`
                }}
              />
              <div className="absolute top-0 left-1/2 w-0.5 h-full bg-black"/>
            </div>

            <div className="text-lg font-medium">
              {getTuningDirection(deviation)}
            </div>
          </div>
        )}

        <div className="mt-8">
          <h3 className="font-semibold mb-2">Ukulelen viritys (GCEA):</h3>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(ukuleleStrings).map(([stringNote, freq]) => (
              <div 
                key={stringNote}
                className={`p-3 rounded border ${note === stringNote ? 'bg-blue-100 border-blue-500' : 'border-gray-300'}`}
              >
                <div className="font-bold">{stringNote}</div>
                <div className="text-sm text-gray-600">{freq} Hz</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UkuleleTuner;