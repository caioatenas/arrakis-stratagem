import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase recovery link sets a session via the URL hash.
    // Wait until that session is established before allowing a password change.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setReady(true);
      }
    });

    // Also check current session in case the event already fired.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    toast.success('Senha atualizada! Faça login com a nova senha.');
    await supabase.auth.signOut();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8"
      >
        <div className="text-center space-y-2">
          <h1 className="text-display text-4xl text-primary tracking-[0.2em]">ARRAKIS</h1>
          <p className="text-muted-foreground font-body text-lg tracking-wider">Nova Senha</p>
        </div>

        <div className="border-glow rounded-lg p-6 space-y-4">
          <h2 className="text-display text-xl text-foreground text-center">
            Redefinir Senha
          </h2>

          {!ready ? (
            <div className="text-center text-sm text-muted-foreground font-body py-4">
              Validando link de recuperação...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <Input
                type="password"
                placeholder="Nova senha"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                className="bg-secondary/50 border-border text-foreground font-body"
              />
              <Input
                type="password"
                placeholder="Confirmar nova senha"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                minLength={6}
                className="bg-secondary/50 border-border text-foreground font-body"
              />

              {error && <p className="text-destructive text-sm font-body">{error}</p>}

              <Button type="submit" disabled={loading} className="w-full font-display tracking-wider">
                {loading ? 'Atualizando...' : 'Atualizar Senha'}
              </Button>
            </form>
          )}

          <button
            onClick={() => navigate('/', { replace: true })}
            className="w-full text-center text-sm text-muted-foreground hover:text-primary transition-colors font-body"
          >
            Voltar ao login
          </button>
        </div>
      </motion.div>
    </div>
  );
}
