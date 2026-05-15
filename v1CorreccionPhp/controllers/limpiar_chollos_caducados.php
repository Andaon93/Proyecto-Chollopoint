<?php
// ============================================================
//  tareas/limpiar_chollos_caducados.php
//
//  Borra de la base de datos todos los chollos que llevan
//  más de 2 días caducados (es decir, cuya fecha de expiración
//  fue hace más de 2 días).
//
//  Un chollo caduca 24 horas después de publicarse.
//  Este script lo borra definitivamente 2 días después de caducar,
//  igual que si el autor lo hubiera borrado manualmente.
//  Al borrarlo en chollos, se borran también automáticamente
//  sus comentarios, votos y favoritos gracias a ON DELETE CASCADE.
//
//  Hay dos formas de ejecutar este script:
//
//  1. Automática (recomendada): se llama desde index.php en cada
//     petición, así no necesitas configurar nada extra.
//
//  2. Manual desde la terminal:
//     php tareas/limpiar_chollos_caducados.php
//
//  3. Cron job (para servidores Linux, ejecución programada):
//     Abre el cron con:  crontab -e
//     Añade esta línea para que se ejecute cada día a las 3:00 AM:
//     0 3 * * * php /ruta/completa/a/tareas/limpiar_chollos_caducados.php
// ============================================================

require_once __DIR__ . '/../config/database.php';

function limpiarChollosCaducados()
{
    $bd = conexionBaseDatos();

    // Borramos los chollos cuya fecha de expiración fue hace más de 2 días
    // DATE_SUB(NOW(), INTERVAL 2 DAY) = la fecha y hora de hace exactamente 2 días
    // Si expira_en es anterior a esa fecha, el chollo lleva más de 2 días caducado
    $consulta = $bd->prepare(
        "DELETE FROM chollos
         WHERE expira_en < DATE_SUB(NOW(), INTERVAL 2 DAY)"
    );
    $consulta->execute();

    // Devolvemos cuántos chollos se borraron (útil para ver en los logs)
    $chollosBorrados = $consulta->rowCount();

    return $chollosBorrados;
}


// ── Bloque que solo se ejecuta si llaman a este archivo directamente ──────────
// Si el archivo se incluye desde index.php, este bloque no se ejecuta
if (basename(__FILE__) === basename($_SERVER['SCRIPT_FILENAME'] ?? '')) {
    $cantidad = limpiarChollosCaducados();
    echo '[CholloPoint] Limpieza completada: ' . $cantidad . ' chollo(s) caducado(s) eliminado(s).' . PHP_EOL;
}