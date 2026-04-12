'use client'

import { useState, useRef, useCallback } from 'react'
import { Mic, Square, Upload, X, Loader2, Image as ImageIcon } from 'lucide-react'
import type { Profile, QuoteTemplate, JobType } from '@/types'
import { JOB_TYPE_LABELS } from '@/types'
import type { QuoteFormData } from '../NewQuoteWizard'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

interface VoicePhotoStepProps {
  profile: Profile | null
  templates: QuoteTemplate[]
  formData: QuoteFormData
  onUpdate: (updates: Partial<QuoteFormData>) => void
  onBack: () => void
  onGenerate: () => void
}

export function VoicePhotoStep({ profile, templates, formData, onUpdate, onBack, onGenerate }: VoicePhotoStepProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [transcribing, setTranscribing] = useState(false)
  const [analyzingPhotos, setAnalyzingPhotos] = useState(false)
  const [uploadingPhotos, setUploadingPhotos] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const maxPhotos = profile?.subscription_tier === 'pro' ? 6 : 3

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/webm'

      const recorder = new MediaRecorder(stream, { mimeType })
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunksRef.current, { type: mimeType })
        await handleTranscription(blob, mimeType)
      }

      recorder.start(1000)
      mediaRecorderRef.current = recorder
      setIsRecording(true)
      setRecordingTime(0)

      timerRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1)
      }, 1000)
    } catch {
      toast({
        title: 'Microphone access denied',
        description: 'Please allow microphone access to record a voice note.',
        variant: 'destructive',
      })
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isRecording])

  async function handleTranscription(blob: Blob, mimeType: string) {
    setTranscribing(true)
    try {
      // Upload voice note to Supabase Storage
      const supabase = createClient()
      const filename = `voice-notes/${uuidv4()}.webm`
      const { data: uploadData } = await supabase.storage
        .from('voice-notes')
        .upload(filename, blob, { contentType: mimeType })

      if (uploadData) {
        const { data: { publicUrl } } = supabase.storage
          .from('voice-notes')
          .getPublicUrl(uploadData.path)
        onUpdate({ voiceNoteUrl: publicUrl })
      }

      // Transcribe
      const formDataObj = new FormData()
      formDataObj.append('audio', blob, 'recording.webm')
      const res = await fetch('/api/transcribe', { method: 'POST', body: formDataObj })
      if (!res.ok) throw new Error('Transcription failed')
      const { transcript } = await res.json()
      onUpdate({ voiceTranscript: transcript })
    } catch {
      toast({
        title: 'Transcription failed',
        description: 'You can type your job description manually below.',
        variant: 'destructive',
      })
    } finally {
      setTranscribing(false)
    }
  }

  async function handlePhotoUpload(files: FileList) {
    const remaining = maxPhotos - formData.photoUrls.length
    if (remaining <= 0) {
      toast({ title: `Maximum ${maxPhotos} photos allowed`, variant: 'destructive' })
      return
    }

    const filesToProcess = Array.from(files).slice(0, remaining)
    setUploadingPhotos(true)

    try {
      const supabase = createClient()
      const uploadedUrls: string[] = []

      for (const file of filesToProcess) {
        const filename = `site-photos/${uuidv4()}-${file.name}`
        const { data } = await supabase.storage
          .from('site-photos')
          .upload(filename, file, { contentType: file.type })

        if (data) {
          const { data: { publicUrl } } = supabase.storage
            .from('site-photos')
            .getPublicUrl(data.path)
          uploadedUrls.push(publicUrl)
        }
      }

      const newUrls = [...formData.photoUrls, ...uploadedUrls]
      onUpdate({ photoUrls: newUrls })

      // Analyse photos
      if (uploadedUrls.length > 0) {
        setAnalyzingPhotos(true)
        const analyses: string[] = []
        for (const url of uploadedUrls) {
          const res = await fetch('/api/analyze-photo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrl: url }),
          })
          if (res.ok) {
            const { analysis } = await res.json()
            if (analysis) analyses.push(analysis)
          }
        }
        const combined = [...(formData.photoAnalysis ? [formData.photoAnalysis] : []), ...analyses].join('\n\n')
        onUpdate({ photoAnalysis: combined })
        setAnalyzingPhotos(false)
      }
    } catch {
      toast({
        title: 'Photo upload failed',
        description: 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setUploadingPhotos(false)
      setAnalyzingPhotos(false)
    }
  }

  function removePhoto(index: number) {
    const urls = formData.photoUrls.filter((_, i) => i !== index)
    onUpdate({ photoUrls: urls })
  }

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }

  const canGenerate = formData.voiceTranscript.trim().length > 20

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground">Voice note + photos</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Describe the job out loud or type it below. Attach site photos for more accurate quotes.
        </p>
      </div>

      {/* Job type */}
      <div className="mb-6">
        <label className="text-sm font-medium text-foreground mb-2 block">Job type</label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(JOB_TYPE_LABELS) as JobType[]).map((type) => (
            <button
              key={type}
              onClick={() => onUpdate({ jobType: type })}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                formData.jobType === type
                  ? 'border-gold bg-gold/20 text-gold'
                  : 'border-border text-muted-foreground hover:border-gold/40 hover:text-foreground'
              }`}
            >
              {JOB_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      {/* Template selector */}
      {templates.length > 0 && (
        <div className="mb-6">
          <label className="text-sm font-medium text-foreground mb-2 block">
            Start from template <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onUpdate({ templateId: null })}
              className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                !formData.templateId
                  ? 'border-gold bg-gold/20 text-gold'
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              No template
            </button>
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => onUpdate({ templateId: t.id })}
                className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                  formData.templateId === t.id
                    ? 'border-gold bg-gold/20 text-gold'
                    : 'border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Voice recorder */}
      <div className="rounded-xl border border-border bg-card p-6 mb-5">
        <div className="text-sm font-medium text-foreground mb-4">Voice note</div>
        <div className="flex flex-col items-center py-4">
          {/* Record button */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={transcribing}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
              isRecording
                ? 'bg-red-500 recording-pulse'
                : 'bg-red-500/20 border-2 border-red-500 hover:bg-red-500/30'
            }`}
          >
            {transcribing ? (
              <Loader2 className="h-8 w-8 text-red-400 animate-spin" />
            ) : isRecording ? (
              <Square className="h-8 w-8 text-white fill-white" />
            ) : (
              <Mic className="h-8 w-8 text-red-400" />
            )}
          </button>

          {/* Waveform + timer */}
          <div className="mt-4 h-8 flex items-center gap-0.5">
            {isRecording ? (
              <>
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-red-400 rounded-full waveform-bar"
                    style={{
                      animationDelay: `${i * 0.06}s`,
                      minHeight: '4px',
                    }}
                  />
                ))}
              </>
            ) : null}
          </div>

          <div className="mt-2 text-sm font-mono text-muted-foreground">
            {transcribing ? 'Transcribing...' : isRecording ? formatTime(recordingTime) : 'Tap to record'}
          </div>

          <p className="text-xs text-muted-foreground text-center mt-3 max-w-sm">
            {isRecording
              ? 'Describe the job — materials, measurements, site access, anything relevant.'
              : 'Record a voice note describing the job after your site visit.'}
          </p>
        </div>
      </div>

      {/* Transcript / manual input */}
      <div className="mb-5">
        <label className="text-sm font-medium text-foreground mb-2 block">
          Job description{' '}
          {formData.voiceTranscript && (
            <span className="text-muted-foreground font-normal">(from voice note — edit if needed)</span>
          )}
        </label>
        <Textarea
          value={formData.voiceTranscript}
          onChange={(e) => onUpdate({ voiceTranscript: e.target.value })}
          placeholder="Describe the job: what needs to be done, measurements, materials, site access, anything relevant to pricing..."
          rows={5}
          className="text-sm"
        />
        <div className="text-xs text-muted-foreground mt-1 text-right">
          {formData.voiceTranscript.length} characters
        </div>
      </div>

      {/* Photo upload */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-foreground">
            Site photos{' '}
            <span className="text-muted-foreground font-normal">
              ({formData.photoUrls.length}/{maxPhotos})
            </span>
          </label>
          {analyzingPhotos && (
            <div className="flex items-center gap-1.5 text-xs text-gold">
              <Loader2 className="h-3 w-3 animate-spin" />
              Analysing photos...
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {formData.photoUrls.map((url, i) => (
            <div key={url} className="relative aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Site photo ${i + 1}`}
                className="w-full h-full object-cover rounded-lg border border-border"
              />
              <button
                onClick={() => removePhoto(i)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center"
              >
                <X className="h-3 w-3 text-white" />
              </button>
            </div>
          ))}

          {formData.photoUrls.length < maxPhotos && (
            <label className="aspect-square rounded-lg border border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-gold/50 transition-colors">
              {uploadingPhotos ? (
                <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
              ) : (
                <>
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground mt-1">Add photo</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                multiple
                capture="environment"
                className="sr-only"
                onChange={(e) => e.target.files && handlePhotoUpload(e.target.files)}
                disabled={uploadingPhotos}
              />
            </label>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          onClick={onGenerate}
          disabled={!canGenerate || transcribing || uploadingPhotos || analyzingPhotos}
          className="bg-gold hover:bg-gold-dark flex-1 sm:flex-none sm:min-w-40"
        >
          Generate Quote
        </Button>
      </div>

      {!canGenerate && (
        <p className="text-xs text-muted-foreground mt-2">
          Add a job description (at least 20 characters) to generate a quote
        </p>
      )}
    </div>
  )
}
