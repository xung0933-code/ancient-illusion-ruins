/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export class CameraSystem {
  public tileSize: number = 48; // base tile size in pixels
  public cameraX: number = 0; // top-left world x in pixels
  public cameraY: number = 0; // top-left world y in pixels
  public viewportWidth: number = 800;
  public viewportHeight: number = 600;

  public updateViewport(width: number, height: number) {
    this.viewportWidth = width;
    this.viewportHeight = height;

    // Adapt tile size dynamically so ~9-10 tiles fit across a 9:16 portrait viewport
    if (width <= 520) {
      this.tileSize = Math.max(36, Math.min(46, Math.floor(width / 9.2)));
    } else if (width > 1200) {
      this.tileSize = 52;
    } else {
      this.tileSize = 48;
    }
  }

  /**
   * Updates camera position smoothly following player while clamping to map boundaries.
   * If map fits entirely within viewport, camera centers the map.
   * If camera reaches edge, camera stops and player naturally approaches the screen edge.
   */
  public update(playerX: number, playerY: number, mapWidth: number, mapHeight: number) {
    const totalWorldWidth = mapWidth * this.tileSize;
    const totalWorldHeight = mapHeight * this.tileSize;

    // Player center in world coordinates
    const playerWorldCenterX = (playerX + 0.5) * this.tileSize;
    const playerWorldCenterY = (playerY + 0.5) * this.tileSize;

    // Ideal top-left of camera to center player
    let targetCameraX = playerWorldCenterX - this.viewportWidth / 2;
    let targetCameraY = playerWorldCenterY - this.viewportHeight / 2;

    // Clamping camera to map bounds
    if (totalWorldWidth <= this.viewportWidth) {
      // Center the map horizontally
      targetCameraX = (totalWorldWidth - this.viewportWidth) / 2;
    } else {
      // Clamp between 0 and (totalWorldWidth - viewportWidth)
      targetCameraX = Math.max(0, Math.min(targetCameraX, totalWorldWidth - this.viewportWidth));
    }

    if (totalWorldHeight <= this.viewportHeight) {
      // Center the map vertically
      targetCameraY = (totalWorldHeight - this.viewportHeight) / 2;
    } else {
      // Clamp between 0 and (totalWorldHeight - viewportHeight)
      targetCameraY = Math.max(0, Math.min(targetCameraY, totalWorldHeight - this.viewportHeight));
    }

    this.cameraX = targetCameraX;
    this.cameraY = targetCameraY;
  }

  /**
   * Convert grid tile (gx, gy) to canvas screen coordinates (sx, sy)
   */
  public tileToScreen(gx: number, gy: number): { x: number; y: number } {
    return {
      x: Math.round(gx * this.tileSize - this.cameraX),
      y: Math.round(gy * this.tileSize - this.cameraY),
    };
  }

  /**
   * Convert world pixel coordinate to screen coordinate
   */
  public worldToScreen(wx: number, wy: number): { x: number; y: number } {
    return {
      x: Math.round(wx - this.cameraX),
      y: Math.round(wy - this.cameraY),
    };
  }

  /**
   * Check if a tile is currently visible in viewport (frustum culling)
   */
  public isTileVisible(gx: number, gy: number, marginTiles: number = 2): boolean {
    const screen = this.tileToScreen(gx, gy);
    const margin = marginTiles * this.tileSize;
    return (
      screen.x + this.tileSize >= -margin &&
      screen.x <= this.viewportWidth + margin &&
      screen.y + this.tileSize >= -margin &&
      screen.y <= this.viewportHeight + margin
    );
  }
}
