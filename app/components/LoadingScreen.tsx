export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-finoradark-bg flex flex-col items-center justify-center gap-6">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border-4 border-purple-100 dark:border-finoradark-card2"></div>
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-600 dark:border-t-finoradark-glow animate-spin"></div>
        <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-purple-400 dark:border-t-finoradark-glow animate-spin" style={{ animationDuration: '0.6s', animationDirection: 'reverse' }}></div>
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="text-2xl font-bold text-purple-600 dark:text-finoradark-glow tracking-wide">Finora</span>
        <span className="text-sm text-gray-400 dark:text-finoradark-textmuted font-medium">Carregando...</span>
      </div>
    </div>
  );
}