import * as turf from '@turf/turf';
import type { Feature, Polygon, MultiPolygon, BBox } from 'geojson';

export interface SpatialIndexOptions {
  gridSize?: number; // Number of cells per dimension
}

interface GridCell {
  x: number;
  y: number;
}

interface IndexedFeature {
  feature: Feature<Polygon | MultiPolygon>;
  bbox: BBox;
  cells: GridCell[];
}

/**
 * Creates a spatial index for efficient polygon adjacency queries
 */
export class SpatialIndex {
  private features: IndexedFeature[] = [];
  private grid: Map<string, number[]> = new Map();
  private gridSize: number;
  private bounds: BBox | null = null;
  private cellWidth: number = 0;
  private cellHeight: number = 0;

  constructor(options: SpatialIndexOptions = {}) {
    this.gridSize = options.gridSize || 10;
  }

  /**
   * Adds features to the spatial index
   */
  addFeatures(features: Feature<Polygon | MultiPolygon>[]) {
    // Calculate overall bounds
    this.calculateBounds(features);
    
    if (!this.bounds) return;

    // Calculate cell dimensions
    this.cellWidth = (this.bounds[2] - this.bounds[0]) / this.gridSize;
    this.cellHeight = (this.bounds[3] - this.bounds[1]) / this.gridSize;

    // Index each feature
    features.forEach((feature, index) => {
      const bbox = turf.bbox(feature);
      const cells = this.getCellsForBBox(bbox);
      
      const indexedFeature: IndexedFeature = {
        feature,
        bbox,
        cells
      };
      
      this.features.push(indexedFeature);
      
      // Add to grid
      cells.forEach(cell => {
        const key = this.getCellKey(cell);
        if (!this.grid.has(key)) {
          this.grid.set(key, []);
        }
        this.grid.get(key)!.push(index);
      });
    });
  }

  /**
   * Finds potential neighbors for a feature
   */
  getPotentialNeighbors(featureIndex: number): number[] {
    if (featureIndex >= this.features.length) return [];
    
    const feature = this.features[featureIndex];
    const neighborIndices = new Set<number>();
    
    // Expand search to adjacent cells
    const expandedCells = this.getExpandedCells(feature.cells);
    
    expandedCells.forEach(cell => {
      const key = this.getCellKey(cell);
      const indices = this.grid.get(key) || [];
      indices.forEach(idx => {
        if (idx !== featureIndex) {
          neighborIndices.add(idx);
        }
      });
    });
    
    return Array.from(neighborIndices);
  }

  /**
   * Gets the indexed features
   */
  getFeatures(): Feature<Polygon | MultiPolygon>[] {
    return this.features.map(f => f.feature);
  }

  /**
   * Calculates the overall bounds of all features
   */
  private calculateBounds(features: Feature<Polygon | MultiPolygon>[]) {
    if (features.length === 0) return;
    
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;
    
    features.forEach(feature => {
      const bbox = turf.bbox(feature);
      minX = Math.min(minX, bbox[0]);
      minY = Math.min(minY, bbox[1]);
      maxX = Math.max(maxX, bbox[2]);
      maxY = Math.max(maxY, bbox[3]);
    });
    
    this.bounds = [minX, minY, maxX, maxY];
  }

  /**
   * Gets grid cells that intersect with a bounding box
   */
  private getCellsForBBox(bbox: BBox): GridCell[] {
    if (!this.bounds) return [];
    
    const cells: GridCell[] = [];
    
    const minCellX = Math.max(0, Math.floor((bbox[0] - this.bounds[0]) / this.cellWidth));
    const minCellY = Math.max(0, Math.floor((bbox[1] - this.bounds[1]) / this.cellHeight));
    const maxCellX = Math.min(this.gridSize - 1, Math.ceil((bbox[2] - this.bounds[0]) / this.cellWidth));
    const maxCellY = Math.min(this.gridSize - 1, Math.ceil((bbox[3] - this.bounds[1]) / this.cellHeight));
    
    for (let x = minCellX; x <= maxCellX; x++) {
      for (let y = minCellY; y <= maxCellY; y++) {
        cells.push({ x, y });
      }
    }
    
    return cells;
  }

  /**
   * Gets expanded cells including adjacent cells
   */
  private getExpandedCells(cells: GridCell[]): GridCell[] {
    const expanded = new Set<string>();
    
    cells.forEach(cell => {
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const x = cell.x + dx;
          const y = cell.y + dy;
          
          if (x >= 0 && x < this.gridSize && y >= 0 && y < this.gridSize) {
            expanded.add(this.getCellKey({ x, y }));
          }
        }
      }
    });
    
    return Array.from(expanded).map(key => {
      const [x, y] = key.split(',').map(Number);
      return { x, y };
    });
  }

  /**
   * Gets a unique key for a grid cell
   */
  private getCellKey(cell: GridCell): string {
    return `${cell.x},${cell.y}`;
  }
}