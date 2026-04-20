import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

type Mode = 'signin' | 'signup' | 'forgot';

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp, signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'forgot') {
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      setLoading(false);

      if (resetError) {
        setError(resetError.message);
        return;
      }

      toast.success('Email enviado! Verifique sua caixa de entrada para redefinir a senha.');
      setMode('signin');
      return;
    }

    const result = mode === 'signup'
      ? await signUp(email, password, displayName || 'Fremen')
      : await signIn(email, password);

    if (result.error) setError(result.error.message);
    setLoading(false);
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setError('');
  };

  const headerLabel = mode === 'signup' ? 'Criar Conta' : mode === 'forgot' ? 'Recuperar Senha' : 'Entrar';
  const submitLabel = mode === 'signup' ? 'Criar Conta' : mode === 'forgot' ? 'Enviar link' : 'Entrar';

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8"
      >
        <div className="text-center space-y-2">
          <h1 className="text-display text-4xl text-primary tracking-[0.2em]">ARRAKIS</h1>
          <p className="text-muted-foreground font-body text-lg tracking-wider">Guerra pela Especiaria</p>
        </div>

        <div className="border-glow rounded-lg p-6 space-y-4">
          <h2 className="text-display text-xl text-foreground text-center">{headerLabel}</h2>

          <form onSubmit={handleSubmit} className="space-y-3">
            <AnimatePresence mode="wait">
              {mode === 'signup' && (
                <motion.div
                  key="name"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Input
                    placeholder="Nome de guerra"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    className="bg-secondary/50 border-border text-foreground font-body"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="bg-secondary/50 border-border text-foreground font-body"
            />

            {mode !== 'forgot' && (
              <Input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                className="bg-secondary/50 border-border text-foreground font-body"
              />
            )}

            {mode === 'forgot' && (
              <p className="text-xs text-muted-foreground font-body italic">
                Enviaremos um link para redefinir a senha no seu email.
              </p>
            )}

            {error && <p className="text-destructive text-sm font-body">{error}</p>}

            <Button type="submit" disabled={loading} className="w-full font-display tracking-wider">
              {loading ? 'Aguarde...' : submitLabel}
            </Button>
          </form>

          <div className="space-y-2 pt-1">
            {mode === 'signin' && (
              <>
                <button
                  type="button"
                  onClick={() => switchMode('forgot')}
                  className="w-full text-center text-xs text-muted-foreground hover:text-primary transition-colors font-body"
                >
                  Esqueci minha senha
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className="w-full text-center text-sm text-muted-foreground hover:text-primary transition-colors font-body"
                >
                  Criar nova conta
                </button>
              </>
            )}

            {mode === 'signup' && (
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="w-full text-center text-sm text-muted-foreground hover:text-primary transition-colors font-body"
              >
                Já tem conta? Entrar
              </button>
            )}

            {mode === 'forgot' && (
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="w-full text-center text-sm text-muted-foreground hover:text-primary transition-colors font-body inline-flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" /> Voltar ao login
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground font-body italic">
          "Aquele que controla a especiaria, controla o universo."
        </p>
      </motion.div>
    </div>
  );
}
