'use client';

import { Loader2, RefreshCw, Wifi, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AiRetryDialogProps {
  open: boolean;
  onRetry: () => void | Promise<void>;
  onClose: () => void;
  isRetrying?: boolean;
}

export function AiRetryDialog({ open, onRetry, onClose, isRetrying = false }: AiRetryDialogProps) {
  if (!open) return null;

  return (
    // Backdrop
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={!isRetrying ? onClose : undefined} />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-sm mx-4 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">

        {/* Top accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-orange-400 to-red-400" />

        <div className="p-6 text-center">
          {/* Icon */}
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-700 flex items-center justify-center">
            {isRetrying ? (
              <Loader2 className="h-7 w-7 text-amber-500 animate-spin" />
            ) : (
              <Wifi className="h-7 w-7 text-amber-500" />
            )}
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            {isRetrying ? 'Retrying…' : 'AI Temporarily Unavailable'}
          </h2>

          {/* Message */}
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-1">
            {isRetrying
              ? 'Connecting to the AI engine. Please wait a moment…'
              : 'The AI scoring engine is currently experiencing high demand and could not complete your request.'}
          </p>
          {!isRetrying && (
            <p className="text-xs text-slate-500 dark:text-slate-500 mb-6">
              This is usually resolved within a few seconds. Please try again.
            </p>
          )}

          {/* Info row */}
          {!isRetrying && (
            <div className="flex items-start gap-2 p-3 mb-5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-left">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                Your essay / summary is <strong>still saved</strong>. Clicking <strong>Try Again</strong> will re-submit it immediately.
              </p>
            </div>
          )}

          {/* Buttons */}
          {!isRetrying && (
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={onClose}
                disabled={isRetrying}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0"
                onClick={onRetry}
                disabled={isRetrying}
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
