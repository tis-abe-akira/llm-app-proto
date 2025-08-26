// AudioWorklet processor for real-time audio processing
class AudioProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.chunkCount = 0;
        this.isRecording = false;
        this.audioBuffer = [];
        this.bufferSize = 0;
        this.targetBufferSize = 3072; // 短い発話用に大きなバッファ（約200ms at 16kHz）
        this.silenceThreshold = 0.0008; // より敏感な無音検出
        this.silenceCounter = 0;
        this.maxSilenceFrames = 20; // 約1秒の無音で強制送信
        
        // Listen for messages from main thread
        this.port.onmessage = (event) => {
            const { type, data } = event.data;
            
            switch (type) {
                case 'start':
                    this.isRecording = true;
                    this.originalSampleRate = data.originalSampleRate;
                    this.audioBuffer = [];
                    this.bufferSize = 0;
                    this.silenceCounter = 0;
                    console.log('🎤 AudioWorklet: Recording started with optimized buffering for short speech');
                    break;
                case 'stop':
                    this.isRecording = false;
                    // Send any remaining buffered audio
                    if (this.audioBuffer.length > 0) {
                        this.flushBuffer();
                    }
                    console.log('🛑 AudioWorklet: Recording stopped');
                    break;
            }
        };
    }
    
    process(inputs, outputs, parameters) {
        const input = inputs[0];
        
        if (!this.isRecording || !input || !input[0]) {
            return true;
        }
        
        const inputBuffer = input[0]; // First channel
        
        try {
            // Calculate audio level for silence detection
            const audioLevel = this.calculateAudioLevel(inputBuffer);
            
            // Downsample to 16kHz first
            const downsampled = this.downsampleTo16kHz(inputBuffer, this.originalSampleRate);
            
            // Check if this is speech or silence
            if (audioLevel > this.silenceThreshold) {
                // Speech detected - add to buffer and reset silence counter
                this.audioBuffer.push(...downsampled);
                this.bufferSize += downsampled.length;
                this.silenceCounter = 0;
                
                // Send when buffer is large enough
                if (this.bufferSize >= this.targetBufferSize) {
                    this.flushBuffer();
                }
            } else {
                // Silence detected
                this.silenceCounter++;
                
                // If we have audio in buffer and enough silence, send it immediately
                if (this.audioBuffer.length > 0 && this.silenceCounter >= this.maxSilenceFrames) {
                    this.flushBuffer();
                    this.port.postMessage({
                        type: 'speechEnd',
                        data: 'Speech ended (silence detected)'
                    });
                }
            }
        } catch (error) {
            this.port.postMessage({
                type: 'error',
                data: `Audio processing error: ${error.message}`
            });
        }
        
        return true; // Keep processor alive
    }
    
    flushBuffer() {
        if (this.audioBuffer.length === 0) return;
        
        // Convert accumulated buffer to PCM16
        const pcmData = this.convertToPCM16(new Float32Array(this.audioBuffer));
        
        // Send audio data to main thread
        this.port.postMessage({
            type: 'audioData',
            data: pcmData,
            samplesCount: this.audioBuffer.length
        });
        
        this.chunkCount++;
        
        // Log progress every 5 chunks (less spam for short speech)
        if (this.chunkCount % 5 === 0) {
            this.port.postMessage({
                type: 'debug',
                data: `📡 Sent ${this.chunkCount} chunks, size: ${pcmData.byteLength}B, samples: ${this.audioBuffer.length}`
            });
        }
        
        // Reset buffer
        this.audioBuffer = [];
        this.bufferSize = 0;
    }
    
    calculateAudioLevel(buffer) {
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
            sum += Math.abs(buffer[i]);
        }
        return sum / buffer.length;
    }
    
    downsampleTo16kHz(buffer, originalSampleRate) {
        if (originalSampleRate === 16000) {
            return buffer;
        }
        
        const downsampleRate = Math.round(originalSampleRate / 16000);
        const downsampledLength = Math.floor(buffer.length / downsampleRate);
        const downsampledBuffer = new Float32Array(downsampledLength);
        
        for (let i = 0; i < downsampledLength; i++) {
            downsampledBuffer[i] = buffer[i * downsampleRate];
        }
        
        return downsampledBuffer;
    }
    
    convertToPCM16(float32Array) {
        const buffer = new ArrayBuffer(float32Array.length * 2);
        const view = new DataView(buffer);
        
        for (let i = 0; i < float32Array.length; i++) {
            // Convert -1 to 1 range to -32768 to 32767 range
            let sample = Math.max(-1, Math.min(1, float32Array[i]));
            sample = sample < 0 ? sample * 32768 : sample * 32767;
            
            // Write as 16-bit integer with little endian
            view.setInt16(i * 2, Math.round(sample), true);
        }
        
        return buffer;
    }
}

registerProcessor('audio-processor', AudioProcessor);