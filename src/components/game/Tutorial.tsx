import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, ChevronRight, HelpCircle } from 'lucide-react';

const TUTORIAL_STEPS = [
  {
    target: 'map',
    title: 'O Mapa de Arrakis',
    text: 'Este é o mapa de Arrakis. Cada área é um território que pode ser conquistado.',
  },
  {
    target: 'map',
    title: 'Territórios',
    text: 'Cada território possui força militar e produção de especiaria (⟡). Controle territórios para gerar spice.',
  },
  {
    target: 'actions',
    title: 'Ações por Turno',
    text: 'Você pode realizar até 2 ações por turno. Selecione um território no mapa para ver as opções.',
  },
  {
    target: 'actions',
    title: 'Tipos de Ação',
    text: 'Ações disponíveis: Mover tropas, Atacar inimigos, Fortificar defesas, Espionar e Extrair spice.',
  },
  {
    target: 'resolve',
    title: 'Resolução de Turno',
    text: 'Após escolher suas ações, o turno será resolvido automaticamente pelo sistema.',
  },
  {
    target: 'player',
    title: 'Vitória',
    text: 'Controle 60% do mapa, elimine todos os inimigos ou acumule 500 spice para vencer!',
  },
];

const STORAGE_KEY = 'arrakis_tutorial_completed';

export function Tutorial() {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) {
      setActive(true);
    }
  }, []);

  const close = () => {
    setActive(false);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  const next = () => {
    if (step < TUTORIAL_STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      close();
    }
  };

  const current = TUTORIAL_STEPS[step];

  return (
    <>
      {/* Help button - always visible */}
      <button
        onClick={() => { setStep(0); setActive(true); }}
        className="fixed bottom-4 right-4 z-40 w-10 h-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary hover:bg-primary/30 transition-colors"
        title="Ajuda"
      >
        <HelpCircle className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {active && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Tutorial card */}
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed z-50 bottom-20 left-1/2 -translate-x-1/2 w-[90vw] max-w-md bg-card border border-primary/30 rounded-xl p-5 shadow-2xl"
              style={{ boxShadow: '0 0 40px hsl(38 60% 50% / 0.15)' }}
            >
              {/* Step indicator */}
              <div className="flex items-center gap-1.5 mb-3">
                {TUTORIAL_STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 rounded-full transition-all ${
                      i === step ? 'w-6 bg-primary' : i < step ? 'w-3 bg-primary/40' : 'w-3 bg-border'
                    }`}
                  />
                ))}
              </div>

              <h3 className="text-display text-primary text-lg tracking-wide mb-2">{current.title}</h3>
              <p className="text-foreground font-body text-sm leading-relaxed">{current.text}</p>

              <div className="flex items-center justify-between mt-4">
                <button
                  onClick={close}
                  className="text-xs text-muted-foreground hover:text-foreground font-body transition-colors flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Pular
                </button>
                <Button
                  onClick={next}
                  size="sm"
                  className="bg-primary text-primary-foreground hover:bg-primary/80 font-display tracking-wider text-xs gap-1"
                >
                  {step < TUTORIAL_STEPS.length - 1 ? (
                    <>Próximo <ChevronRight className="w-3 h-3" /></>
                  ) : (
                    'Começar!'
                  )}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
