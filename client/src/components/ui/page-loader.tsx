import { Loader2, Download, CheckCircle } from "lucide-react";

interface PageLoaderProps {
  isVisible: boolean;
  message?: string;
  showSuccess?: boolean;
}

export default function PageLoader({ isVisible, message = "Downloading...", showSuccess = false }: PageLoaderProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-2xl max-w-sm w-full mx-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              {showSuccess ? (
                <CheckCircle className="h-8 w-8 text-green-500" />
              ) : (
                <Download className="h-8 w-8 text-primary" />
              )}
            </div>
            {!showSuccess && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-6 w-6 text-primary animate-spin" />
              </div>
            )}
          </div>
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {message}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {showSuccess 
                ? "Download completed successfully!" 
                : "Please wait while your file is being prepared..."
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
