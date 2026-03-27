import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
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

    const result = isSignUp
      ? await signUp(email, password, displayName || 'Fremen')
      : await signIn(email, password);

    if (result.error) setError(result.error.message);
    setLoading(false);
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
          <p className="text-muted-foreground font-body text-lg tracking-wider">Guerra pela Especiaria</p>
        </div>

        <div className="border-glow rounded-lg p-6 space-y-4">
          <h2 className="text-display text-xl text-foreground text-center">
            {isSignUp ? 'Criar Conta' : 'Entrar'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-3">
            {isSignUp && (
              <Input
                placeholder="Nome de guerra"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="bg-secondary/50 border-border text-foreground font-body"
              />
            )}
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="bg-secondary/50 border-border text-foreground font-body"
            />
            <Input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="bg-secondary/50 border-border text-foreground font-body"
            />

            {error && <p className="text-destructive text-sm font-body">{error}</p>}

            <Button type="submit" disabled={loading} className="w-full font-display tracking-wider">
              {loading ? 'Aguarde...' : isSignUp ? 'Criar Conta' : 'Entrar'}
            </Button>
          </form>

          <button
            onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
            className="w-full text-center text-sm text-muted-foreground hover:text-primary transition-colors font-body"
          >
            {isSignUp ? 'Já tem conta? Entrar' : 'Criar nova conta'}
          </button>
        </div>

        <p className="text-center text-xs text-muted-foreground font-body italic">
          "Aquele que controla a especiaria, controla o universo."
        </p>
      </motion.div>
    </div>
  );
}
