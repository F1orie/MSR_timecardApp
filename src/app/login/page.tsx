import { LoginForm } from './login-form'

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="glass-panel w-full max-w-md p-8 animate-fade-in relative overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500 rounded-full blur-[80px] opacity-20"></div>
                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-cyan-500 rounded-full blur-[80px] opacity-20"></div>

                <div className="relative z-10">
                    <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                        勤怠管理アプリ
                    </h1>
                    <p className="text-gray-400 text-center mb-8">アカウントにログイン</p>

                    <LoginForm />
                </div>
            </div>
        </div>
    )
}
