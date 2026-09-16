# 🚀 Nave Espacial vs Oleadas

Shooter espacial 2D hecho con **HTML5 + Canvas + JavaScript puro** (sin librerías ni dependencias). El jugador controla una nave que dispara rayos láser contra oleadas de enemigos. La partida dura **10 minutos**: si sobrevives hasta el final, ganas; si tu nave es destruida antes, pierdes.

## 🎮 Controles

| Tecla    | Acción                |
|----------|-----------------------|
| `W`      | Mover hacia arriba    |
| `S`      | Mover hacia abajo     |
| `A`      | Mover hacia la izquierda |
| `D`      | Mover hacia la derecha   |
| `Espacio`| Disparar láser        |

## ⚙️ Mecánicas

- **Cooldown de disparo del jugador:** 0,30 s entre disparos.
- **Cooldown de disparo enemigo:** 0,70 s por enemigo.
- **Movimiento libre** dentro de los límites de la pantalla.
- Si un disparo enemigo (o un enemigo) impacta tu nave → **fin de la partida** (una vida = game over).
- Los enemigos aparecen desde la parte superior y se destruyen al recibir el impacto de un láser (los enemigos "pesados", de color naranja, requieren 3 impactos y empiezan a aparecer a partir de los 2 minutos).

## 📈 Dificultad progresiva

A medida que avanza el tiempo de partida:

- **Frecuencia de aparición de enemigos:** aumenta de forma continua (de ~1,6 s entre spawns hasta un mínimo de 0,3 s).
- **Velocidad de los enemigos:** aumenta progresivamente con el tiempo transcurrido.
- **Velocidad general del juego:** las balas y enemigos reciben un ligero multiplicador de velocidad que crece con el tiempo (hasta ~1,4x a los 10 minutos), intensificando la sensación de dificultad.
- A partir del minuto 2 empiezan a aparecer enemigos "pesados" con más resistencia, con probabilidad creciente.

Toda la escalada de dificultad está centralizada en las funciones `getSpawnInterval()`, `getEnemySpeed()`, `getGlobalSpeedMultiplier()` y `getHeavyEnemyChance()` dentro de `game.js`, por si quieres ajustar la curva de dificultad.

## 🏁 Fin de la partida

- **Sobrevives 10 minutos completos →** `GAME OVER` + `YOU WIN`
- **Tu nave es destruida antes →** `GAME OVER` (sin "YOU WIN")

## 📁 Estructura del repositorio

```
/nave-espacial-vs-oleadas
  ├── index.html   ← estructura de la página y el HUD
  ├── style.css    ← estilos visuales
  ├── game.js      ← lógica completa del juego
  └── README.md    ← este documento
```

## 🌐 Cómo jugar en local

No requiere instalación ni build. Basta con abrir `index.html` en cualquier navegador moderno, o servirlo con un servidor estático simple:

```bash
# Opción rápida con Python
python3 -m http.server 8000
# luego abre http://localhost:8000 en el navegador
```

## 🚀 Despliegue en GitHub Pages

1. Sube estos archivos a un repositorio de GitHub (por ejemplo, `nave-espacial-vs-oleadas`).
2. Ve a **Settings → Pages**.
3. En "Source" selecciona la rama `main` y la carpeta `/ (root)`.
4. Guarda los cambios; GitHub te dará una URL pública del tipo:
   `https://<tu-usuario>.github.io/nave-espacial-vs-oleadas/`

## 🔧 Parámetros clave

| Parámetro                  | Valor                          |
|-----------------------------|---------------------------------|
| Cooldown disparo jugador    | 0,30 s                         |
| Cooldown disparo enemigo    | 0,70 s                         |
| Duración de la partida      | 10 minutos (600 s)             |
| Dificultad                  | Aumenta progresivamente con el tiempo |
| Condición de victoria       | Sobrevivir 10 minutos          |
| Condición de derrota        | Nave destruida antes de los 10 minutos |

---

Hecho con 🖤 usando únicamente HTML, CSS y JavaScript vanilla.
