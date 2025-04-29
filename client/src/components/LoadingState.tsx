export default function LoadingState() {
  return (
    <div className="bg-white rounded-xl shadow-md p-8 text-center">
      <div className="mx-auto w-20 h-20 flex items-center justify-center mb-4">
        <svg className="animate-spin h-12 w-12 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
      <h3 className="font-heading text-xl font-semibold text-neutral-800 mb-2">Generiere deinen Post...</h3>
      <p className="text-neutral-600 mb-6 max-w-md mx-auto">
        Wir analysieren das Reiseangebot und erstellen einen perfekten WhatsApp-Post. Dies kann einen Moment dauern.
      </p>
      <div className="space-y-3 max-w-md mx-auto">
        <div className="bg-neutral-100 h-2 rounded-full">
          <div className="bg-primary h-2 rounded-full w-3/4 animate-pulse"></div>
        </div>
        <div className="flex justify-between text-sm text-neutral-600">
          <span>Analysiere Reiseangebot</span>
          <span>75%</span>
        </div>
      </div>
    </div>
  );
}
