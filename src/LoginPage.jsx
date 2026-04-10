import { useState } from 'react'
import { useAuth } from './AuthContext'
import { Sparkles, Mail, Lock, User, ArrowRight, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const { signIn, signUp } = useAuth()
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (isRegister) {
        if (password.length < 6) {
          setError('La contraseña debe tener al menos 6 caracteres')
          setLoading(false)
          return
        }
        const { error } = await signUp(email, password, name)
        if (error) {
          if (error.message.includes('already registered')) {
            setError('Este email ya está registrado. Inicia sesión.')
          } else {
            setError(error.message)
          }
        } else {
          setSuccess('¡Cuenta creada! Revisa tu email para confirmar, o inicia sesión directamente.')
        }
      } else {
        const { error } = await signIn(email, password)
        if (error) {
          if (error.message.includes('Invalid login')) {
            setError('Email o contraseña incorrectos')
          } else {
            setError(error.message)
          }
        }
      }
    } catch (err) {
      setError('Error de conexión. Inténtalo de nuevo.')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 relative overflow-hidden">
      {/* ambient gradients */}
      <div className="absolute -top-[40%] -left-[20%] w-[70vw] h-[70vw] rounded-full opacity-[0.06] pointer-events-none"
        style={{ background: 'radial-gradient(circle, #a78bfa 0%, transparent 70%)' }} />
      <div className="absolute -bottom-[30%] -right-[15%] w-[60vw] h-[60vw] rounded-full opacity-[0.05] pointer-events-none"
        style={{ background: 'radial-gradient(circle, #6ee7b7 0%, transparent 70%)' }} />

      <div className="w-full max-w-md">
        {/* logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
            style={{ background: 'linear-gradient(135deg, #a78bfa 0%, #6ee7b7 100%)' }}>
            <Sparkles size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Workspace</h1>
          <p className="text-white/40 text-sm mt-2">
            {isRegister ? 'Crea tu cuenta para empezar' : 'Inicia sesión en tu dashboard'}
          </p>
        </div>

        {/* form card */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegister && (
              <div>
                <label className="block text-[12px] text-white/50 font-medium mb-2 uppercase tracking-wider">Nombre</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tu nombre"
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl pl-10 pr-4 py-3 text-[14px] text-white/90 placeholder:text-white/25 focus:border-violet-500/40 transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[12px] text-white/50 font-medium mb-2 uppercase tracking-wider">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl pl-10 pr-4 py-3 text-[14px] text-white/90 placeholder:text-white/25 focus:border-violet-500/40 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] text-white/50 font-medium mb-2 uppercase tracking-wider">Contraseña</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl pl-10 pr-4 py-3 text-[14px] text-white/90 placeholder:text-white/25 focus:border-violet-500/40 transition-colors"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertCircle size={16} className="text-red-400 shrink-0" />
                <p className="text-[13px] text-red-300">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                <p className="text-[13px] text-green-300">{success}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[14px] font-semibold text-white transition-all duration-200 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)' }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isRegister ? 'Crear cuenta' : 'Iniciar sesión'}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/[0.06] text-center">
            <button
              onClick={() => { setIsRegister(!isRegister); setError(''); setSuccess('') }}
              className="text-[13px] text-white/40 hover:text-white/70 transition-colors"
            >
              {isRegister ? '¿Ya tienes cuenta? ' : '¿No tienes cuenta? '}
              <span className="text-violet-400 font-medium">
                {isRegister ? 'Inicia sesión' : 'Regístrate'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
