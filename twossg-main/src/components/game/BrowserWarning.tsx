import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Monitor, Info } from 'lucide-react';
import { useState, useEffect } from 'react';

const BROWSER_WARNING_KEY = 'tli_browser_warning_dismissed';
const BROWSER_ID_KEY = 'tli_browser_id';

export const BrowserWarning = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [browserId, setBrowserId] = useState<string | null>(null);

  useEffect(() => {
    // Generate or get browser ID
    let storedBrowserId = localStorage.getItem(BROWSER_ID_KEY);
    if (!storedBrowserId) {
      storedBrowserId = `browser_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem(BROWSER_ID_KEY, storedBrowserId);
    }
    setBrowserId(storedBrowserId);

    // Check if warning was dismissed today
    const dismissedDate = localStorage.getItem(BROWSER_WARNING_KEY);
    const today = new Date().toISOString().split('T')[0];
    
    if (dismissedDate !== today) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(BROWSER_WARNING_KEY, today);
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-0 left-0 right-0 z-50 p-3"
        >
          <div className="max-w-4xl mx-auto">
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 shadow-lg">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-amber-800 flex items-center gap-2">
                    <Monitor className="w-4 h-4" />
                    Lưu ý quan trọng về Thử Thách 20 Ngày
                  </h3>
                  <div className="mt-2 text-sm text-amber-700 space-y-1">
                    <p>
                      ⚠️ <strong>Thử thách chỉ được thực hiện trên 1 trình duyệt duy nhất!</strong>
                    </p>
                    <p>
                      • Dữ liệu tiến độ được lưu trên trình duyệt này và <strong>không thể chuyển</strong> sang trình duyệt/thiết bị khác.
                    </p>
                    <p>
                      • Nếu bạn xóa cache/dữ liệu trình duyệt, tiến độ sẽ <strong>mất hoàn toàn</strong>.
                    </p>
                    <p>
                      • Sau khi hoàn thành, hãy <strong>chụp màn hình chứng chỉ</strong> làm bằng chứng nhận thưởng.
                    </p>
                  </div>
                  
                  {browserId && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 bg-amber-100 rounded-lg px-3 py-1.5 w-fit">
                      <Info className="w-3.5 h-3.5" />
                      <span>Browser ID: <code className="font-mono font-bold">{browserId.slice(-12)}</code></span>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleDismiss}
                  className="p-2 hover:bg-amber-200 rounded-lg transition-colors shrink-0"
                >
                  <X className="w-5 h-5 text-amber-700" />
                </button>
              </div>

              <div className="mt-3 flex justify-end">
                <motion.button
                  onClick={handleDismiss}
                  className="px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Tôi đã hiểu
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
