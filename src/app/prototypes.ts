export {};

declare global {
  interface Number {
    mod(n: number): number;
  }
}

if (!Number.prototype.mod) {
  Number.prototype.mod = function(n: number) {
    return (((this as any) % n) + n) % n;
  };
}
