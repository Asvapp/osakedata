'use client'

import React, { useState, useRef } from 'react';

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext
  }
}

// Määritellään tyyppi ukulelen kielille
type UkuleleString = 'G4' | 'C4' | 'E4' | 'A4';
type UkuleleStrings = Record<UkuleleString, number>;

const UkuleleTuner = () => {
  const [pitch, setPitch] = useState<number>(0);
  const [note, setNote] = useState<UkuleleString | ''>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const ukuleleStrings: UkuleleStrings = {
    'G4': 392.00,
    'C4': 261.63,
    'E4': 329.63,
    'A4': 440.00
  };

  const findClosestNote = (freq: number): UkuleleString | '' => {
    let closestNote: UkuleleString | '' = '';
    let minDiff = Infinity;

    (Object.entries(ukuleleStrings) as [UkuleleString, number][]).forEach(([note, noteFreq]) => {
      const diff = Math.abs(freq - noteFreq);
      if (diff < minDiff) {
        minDiff = diff;
        closestNote = note;
      }
    });

    return minDiff < 30 ? closestNote : '';
  };

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

      processorRef.current.onaudioprocess = (e) => {
        const input = e.inputBuffer.getChannelData(0);
        let sum = 0;
        let maxPeak = 0;
        let crossings = 0;
        let prevSample = 0;

        for (let i = 0; i < input.length; i++) {
          sum += input[i] * input[i];
          maxPeak = Math.max(maxPeak, Math.abs(input[i]));
          
          if (i > 0 && input[i] > 0 && prevSample <= 0) {
            crossings++;
          }
          prevSample = input[i];
        }

        const rms = Math.sqrt(sum / input.length);

        if (rms > 0.01 && maxPeak > 0.02) {
          const frequency = (audioContextRef.current?.sampleRate || 44100) * crossings / (2 * input.length);
          
          if (frequency > 200 && frequency < 500) {
            console.log('Frequency:', frequency.toFixed(1), 'Hz');
            setPitch(frequency);
            const detectedNote = findClosestNote(frequency);
            setNote(detectedNote);
          }
        } else {
          setNote('');
          setPitch(0);
        }
      };

      sourceRef.current.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);
      
      setIsListening(true);
    } catch (err) {
      console.error('Error:', err);
      alert('Mikrofonin käyttö epäonnistui');
    }
  };

  const stopListening = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      sourceRef.current?.disconnect();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsListening(false);
    setNote('');
    setPitch(0);
  };


  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Ukulele Viritin</h2>

      <button
        onClick={isListening ? stopListening : startListening}
        className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mb-6"
      >
        {isListening ? 'Pysäytä' : 'Aloita viritys'}
      </button>

      {/* Kielten taulukko */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className={`p-4 rounded-lg border-2 ${note === 'G4' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
          <div className="text-xl font-bold">1. kieli (G)</div>
          <div className="text-sm">ylin kieli</div>
        </div>
        <div className={`p-4 rounded-lg border-2 ${note === 'C4' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
          <div className="text-xl font-bold">2. kieli (C)</div>
          <div className="text-sm">toinen ylhäältä</div>
        </div>
        <div className={`p-4 rounded-lg border-2 ${note === 'E4' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
          <div className="text-xl font-bold">3. kieli (E)</div>
          <div className="text-sm">toinen alhaalta</div>
        </div>
        <div className={`p-4 rounded-lg border-2 ${note === 'A4' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
          <div className="text-xl font-bold">4. kieli (A)</div>
          <div className="text-sm">alin kieli</div>
        </div>
      </div>

      {/* Viritysskaala - näkyy aina */}
      <div className="p-4 bg-white rounded-lg border shadow-sm">
        <div className="text-lg font-bold mb-2">
          {isListening ? (note ? `Havaittu: ${note.charAt(0)}-kieli` : 'Soita kieltä...') : 'Aloita viritys painamalla nappia'}
        </div>

        <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden mb-2">
          <div className="absolute top-0 left-1/2 h-full w-1 bg-black z-10"/>
          {isListening && note && (
            <div 
              className={`absolute h-full transition-all ${
                Math.abs(pitch - ukuleleStrings[note]) < 5 ? 'bg-green-500' :
                Math.abs(pitch - ukuleleStrings[note]) < 15 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ 
                left: '50%',
                width: '8px',
                transform: `translateX(${Math.max(Math.min((pitch - ukuleleStrings[note]) * 2, 50), -50)}px)`
              }}
            />
          )}
        </div>

        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>← Löysää</span>
          <span>Kiristä →</span>
        </div>

        {isListening && note && (
          <div className="text-center text-lg font-medium">
            {Math.abs(pitch - ukuleleStrings[note]) < 5 ? (
              <span className="text-green-600">✓ Vireessä!</span>
            ) : pitch > ukuleleStrings[note] ? (
              <span className="text-red-600">↓ Löysää kieltä</span>
            ) : (
              <span className="text-red-600">↑ Kiristä kieltä</span>
            )}
          </div>
        )}
      </div>
    </div>
);
};

export default UkuleleTuner;