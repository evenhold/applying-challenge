export default function LoginPage() {
  return (
    <main className="container">
      <section className="form-section">
        <h1>Iniciar sesión</h1>
        <form>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" name="email" placeholder="tu@email.com" required />
          </div>
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input type="password" id="password" name="password" placeholder="••••••••" required />
          </div>
          <button type="submit" className="button">
            Entrar
          </button>
        </form>
        <p className="form-footer">
          <a href="/">← Volver al inicio</a>
        </p>
      </section>
    </main>
  );
}
