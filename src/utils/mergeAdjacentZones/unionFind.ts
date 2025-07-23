/**
 * Union-Find (Disjoint Set Union) data structure
 * Used for efficiently grouping connected zones
 */
export class UnionFind {
  private parent: number[];
  private rank: number[];
  private size: number;
  
  /**
   * Initialize Union-Find structure with n elements (0 to n-1)
   */
  constructor(size: number) {
    this.size = size;
    this.parent = Array.from({ length: size }, (_, i) => i);
    this.rank = new Array(size).fill(0);
  }
  
  /**
   * Find the root of element x with path compression
   */
  find(x: number): number {
    this.validateIndex(x);
    
    if (this.parent[x] !== x) {
      // Path compression: make all nodes point directly to root
      this.parent[x] = this.find(this.parent[x]);
    }
    return this.parent[x];
  }
  
  /**
   * Unite two elements x and y using union by rank
   */
  union(x: number, y: number): void {
    this.validateIndex(x);
    this.validateIndex(y);
    
    const rootX = this.find(x);
    const rootY = this.find(y);
    
    if (rootX === rootY) return; // Already in same set
    
    // Union by rank: attach smaller tree to larger
    if (this.rank[rootX] < this.rank[rootY]) {
      this.parent[rootX] = rootY;
    } else if (this.rank[rootX] > this.rank[rootY]) {
      this.parent[rootY] = rootX;
    } else {
      // Equal rank: attach y to x and increment x's rank
      this.parent[rootY] = rootX;
      this.rank[rootX]++;
    }
  }
  
  /**
   * Check if two elements are in the same set
   */
  connected(x: number, y: number): boolean {
    this.validateIndex(x);
    this.validateIndex(y);
    
    return this.find(x) === this.find(y);
  }
  
  /**
   * Validate that an index is within bounds
   */
  private validateIndex(index: number): void {
    if (index < 0 || index >= this.size) {
      throw new Error(`Index ${index} out of bounds [0, ${this.size - 1}]`);
    }
  }
}