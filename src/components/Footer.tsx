export default function Footer() {
    return (
        <footer className="py-8 px-4 border-t border-gray-200 dark:border-gray-800">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Logo and tagline */}
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">L</span>
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            Lumina – Powered by Google Veo AI
                        </span>
                    </div>

                    {/* Links */}
                    <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                        <a
                            href="/privacy"
                            className="hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            Privacy Policy
                        </a>
                        <a
                            href="/terms"
                            className="hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            Terms of Service
                        </a>
                        <span>
                            Built with ❤️ for the workshop
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
