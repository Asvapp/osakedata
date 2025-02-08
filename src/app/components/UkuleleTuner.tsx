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

    const cents = 1200 * Math.log2(frequency / targetFreq);
    setDeviation(cents);

    return { note: closestNote, diff: closestDiff };
  };

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      analyserRef.current.minDecibels = -90;
      analyserRef.current.maxDecibels = -10;
      analyserRef.current.smoothingTimeConstant = 0.85;
      
      mediaStreamSourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      mediaStreamSourceRef.current.connect(analyserRef.current);
      
      setIsListening(true);
      updatePitch();
    } catch  {
      alert('Salli mikrofonin käyttö selaimen asetuksista');
    }
  };

  const updatePitch = () => {
    if (!isListening || !analyserRef.current || !audioContextRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const frequencyData = new Float32Array(bufferLength);
    analyserRef.current.getFloatFrequencyData(frequencyData);

    const timeData = new Float32Array(bufferLength);
    analyserRef.current.getFloatTimeDomainData(timeData);
    
    const rms = Math.sqrt(timeData.reduce((acc, val) => acc + val * val, 0) / bufferLength);
    const decibels = 20 * Math.log10(rms);

    if (decibels < -50) {
      requestAnimationFrame(updatePitch);
      return;
    }

    let maxValue = -Infinity;
    let maxIndex = -1;
    
    for (let i = 0; i < bufferLength; i++) {
      if (frequencyData[i] > maxValue) {
        maxValue = frequencyData[i];
        maxIndex = i;
      }
    }

    const foundPitch = maxIndex * audioContextRef.current.sampleRate / (bufferLength * 2);

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

  const getTuningColor = (cents: number): string => {
    if (Math.abs(cents) < 5) return 'bg-green-500';
    if (Math.abs(cents) < 15) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getTuningDirection = (cents: number): string => {
    if (Math.abs(cents) < 5) return 'Vireessä! 👍';
    if (cents > 0) return 'Löysää kieltä ⬇️';
    return 'Kiristä kieltä ⬆️';
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Ukulele Viritin</h2>

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