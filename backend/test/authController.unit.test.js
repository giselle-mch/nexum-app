/*
 * Importamos las funciones que deseamos validar mediante pruebas
 * unitarias. Al estar exportadas desde authController.js podemos
 * probar su comportamiento sin iniciar el servidor ni conectarnos
 * a la base de datos.
 */
const {
  normalizeIncomingRole,
  toPublicRole,
  sanitizeUser,
} = require("../src/controllers/authController");

/*
 * Agrupa todas las pruebas relacionadas con las funciones auxiliares
 * del controlador de autenticación.
 */
describe("Funciones unitarias de autenticación", () => {

  /*
   * Verifica que el rol recibido desde la aplicación sea convertido
   * al formato utilizado internamente por la base de datos.
   */
  test("convierte el rol cliente a usuario para guardarlo internamente", () => {
    expect(normalizeIncomingRole("cliente")).toBe("usuario");
  });

  /*
   * Comprueba que el rol arrendador permanezca sin modificaciones.
   */
  test("mantiene el rol arrendador sin modificarlo", () => {
    expect(normalizeIncomingRole("arrendador")).toBe("arrendador");
  });

  /*
   * Verifica que el rol almacenado en la base de datos sea convertido
   * nuevamente al formato que visualizará el usuario.
   */
  test("convierte el rol interno usuario a cliente para mostrarlo públicamente", () => {
    expect(toPublicRole("usuario")).toBe("cliente");
  });

  /*
   * Valida que la función sanitizeUser elimine la contraseña antes
   * de devolver la información del usuario.
   */
  test("elimina la contraseña antes de devolver el usuario", () => {

    /*
     * Simulamos un usuario obtenido desde la base de datos.
     */
    const user = {
      id: 1,
      nombre: "Erick",
      email: "erick@test.com",
      telefono: "6561234567",
      password: "123456",
      rol: "usuario", // Debe llamarse 'rol' para coincidir con el controlador
    };

    /*
     * Ejecutamos la función que estamos probando.
     */
    const result = sanitizeUser(user);

    /*
     * La contraseña nunca debe formar parte de la respuesta.
     */
    expect(result).not.toHaveProperty("password");

    /*
     * Verificamos que los demás datos permanezcan sin cambios.
     */
    expect(result.id).toBe(1);
    expect(result.nombre).toBe("Erick");
    expect(result.email).toBe("erick@test.com");
    expect(result.telefono).toBe("6561234567");

    /*
     * El rol interno "usuario" debe convertirse a "cliente".
     */
    expect(result.rol).toBe("cliente");

  });

});