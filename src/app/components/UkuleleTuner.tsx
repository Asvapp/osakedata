import React, { useState, useEffect, useRef } from 'react';

declare global {
    interface Window {
      webkitAudioContext: typeof AudioContext
    }
  }

const UkuleleTuner = () => {
  const [pitch, setPitch] = useState<number>(0);
  const [note, setNote] = useState<string>('');
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

    Object.entries(ukuleleStrings).forEach(([note, noteFreq]) => {
      const diff = Math.abs(frequency - noteFreq);
      if (diff < closestDiff) {
        closestDiff = diff;
        closestNote = note;
      }
    });

    return { note: closestNote, diff: closestDiff };
  };

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      mediaStreamSourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      
      mediaStreamSourceRef.current.connect(analyserRef.current);
      analyserRef.current.fftSize = 2048;
      
      setIsListening(true);
      setError('');
      
      updatePitch();
    } catch  {
      setError('Mikrofonin käyttöoikeus tarvitaan virittimen käyttöön.');
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
          <div className="text-center space-y-2">
            <div className="text-xl">
              Havaittu nuotti: <strong>{note}</strong>
            </div>
            <div className="text-sm text-gray-600">
              Taajuus: {pitch.toFixed(1)} Hz
            </div>
          </div>
        )}

        <div className="mt-4">
          <h3 className="font-semibold mb-2">Ukulelen viritys (GCEA):</h3>
          <ul className="list-disc pl-5">
            <li>G4: 392.00 Hz</li>
            <li>C4: 261.63 Hz</li>
            <li>E4: 329.63 Hz</li>
            <li>A4: 440.00 Hz</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UkuleleTuner;