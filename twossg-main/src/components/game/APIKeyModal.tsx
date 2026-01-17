import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { validateApiKey } from '@/lib/aiService';
import { X, Key, ExternalLink, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface APIKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (apiKey: string) => void;
  currentKey?: string;
}

export const APIKeyModal = ({ isOpen, onClose, onSave, currentKey }: APIKeyModalProps) => {
  const [apiKey, setApiKey] = useState(currentKey || '');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!apiKey.trim()) {
      setError('Vui lòng nhập API key');
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const isValid = await validateApiKey(apiKey.trim());
      if (isValid) {
        setSuccess(true);
        setTimeout(() => {
          onSave(apiKey.trim());
          onClose();
        }, 1000);
      } else {
        setError('API key không hợp lệ. Vui lòng kiểm tra lại.');
      }
    } catch (err) {
      setError('Không thể xác thực API key. Vui lòng thử lại.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleSkipValidation = () => {
    if (apiKey.trim()) {
      onSave(apiKey.trim());
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 
                       w-[calc(100%-2rem)] max-w-md glass-card-strong rounded-2xl p-6 z-50 
                       overflow-y-auto max-h-[85vh]"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-button flex items-center justify-center">
                <Key className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Groq API Key</h2>
                <p className="text-sm text-muted-foreground">Cần để AI chấm điểm</p>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-accent/5 rounded-xl p-4 mb-6 border border-accent/20">
              <h3 className="font-medium text-accent mb-2">Hướng dẫn lấy API key:</h3>
              <ol className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-accent font-medium">1.</span>
                  Truy cập Groq Console
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent font-medium">2.</span>
                  Đăng ký/Đăng nhập tài khoản
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent font-medium">3.</span>
                  Vào mục "API Keys" và tạo key mới
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent font-medium">4.</span>
                  Copy key và dán vào bên dưới
                </li>
              </ol>
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-3 text-sm text-accent hover:underline"
              >
                <ExternalLink className="w-4 h-4" />
                Mở Groq Console
              </a>
            </div>

            {/* Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setError(null);
                  setSuccess(false);
                }}
                placeholder="gsk_..."
                className="w-full px-4 py-3 bg-muted/50 rounded-xl border border-border 
                         focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none
                         font-mono text-sm"
              />
            </div>

            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-destructive text-sm mb-4"
              >
                <AlertCircle className="w-4 h-4" />
                {error}
              </motion.div>
            )}

            {/* Success message */}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-mint text-sm mb-4"
              >
                <CheckCircle className="w-4 h-4" />
                API key hợp lệ! Đang lưu...
              </motion.div>
            )}

            {/* Buttons */}
            <div className="flex flex-col gap-2">
              <button
                onClick={handleSubmit}
                disabled={isValidating || !apiKey.trim()}
                className="btn-primary text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isValidating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang xác thực...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Xác thực & Lưu
                  </>
                )}
              </button>

              <button
                onClick={handleSkipValidation}
                disabled={!apiKey.trim()}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              >
                Bỏ qua xác thực (lưu trực tiếp)
              </button>
            </div>

            {/* Privacy note */}
            <p className="text-xs text-muted-foreground text-center mt-4">
              🔒 API key được lưu cục bộ trên trình duyệt của bạn. Không được gửi đi bất kỳ đâu ngoài Groq.
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
