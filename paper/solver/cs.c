// Exact solver for Chain Stones (the game in this repo), same rules as play() in index.html.
// Usage:
//   cs replay  < games.txt            check the engine against games recorded by the JS engine
//   cs solve N COUNT SEED [roots]     solve COUNT random deals exactly, print one line per deal
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>

typedef struct { int8_t own[16]; uint8_t sp[16][4]; uint8_t hand[2][8][4]; uint8_t used[2]; int8_t turn, empties; } St;
static int N, K;
static const int DX[4] = {0, 1, 0, -1}, DY[4] = {-1, 0, 1, 0};
static int nbr(int c, int d) { int x = c % N + DX[d], y = c / N + DY[d]; return (x < 0 || y < 0 || x >= N || y >= N) ? -1 : y * N + x; }

static void play(St *s, int hi, int c) {
  int me = s->turn, op = 1 - me; uint8_t a4[4]; memcpy(a4, s->hand[me][hi], 4);
  s->used[me] |= 1 << hi; s->own[c] = me; s->empties--;
  int win[4], nw = 0, lost = 0;
  for (int d = 0; d < 4; d++) {
    int q = nbr(c, d); if (q < 0 || s->own[q] != op) continue;
    int e = (d + 2) % 4, a = a4[d], b = s->sp[q][e];
    if (!a && !b) continue;
    int k = a < b ? a : b; a4[d] -= k; s->sp[q][e] -= k;
    if (a > b) win[nw++] = q; else if (a < b) lost = 1;
  }
  memcpy(s->sp[c], a4, 4);
  for (int i = 0; i < nw; i++) s->own[win[i]] = me;
  if (lost) s->own[c] = op;
  s->turn = op;
}
static int diff(const St *s, int p) { int k = 0; for (int i = 0; i < N * N; i++) k += s->own[i] == p ? 1 : s->own[i] == 1 - p ? -1 : 0; return k; }

// ---- transposition table
static uint64_t Z[16][3][256], ZU[2][8], ZT;
typedef struct { uint64_t key; int8_t v; uint8_t flag; } TT;
#define TTBITS 24
static TT *tt;
static uint64_t hashOf(const St *s) {
  uint64_t h = s->turn ? ZT : 0;
  for (int i = 0; i < N * N; i++) { int sp = s->sp[i][0] | s->sp[i][1] << 2 | s->sp[i][2] << 4 | s->sp[i][3] << 6; h ^= Z[i][s->own[i] + 1][s->own[i] < 0 ? 0 : sp]; }
  for (int p = 0; p < 2; p++) for (int j = 0; j < K; j++) if (s->used[p] >> j & 1) h ^= ZU[p][j];
  return h;
}
static uint64_t rs = 88172645463325252ULL;
static uint64_t rnd64(void) { rs ^= rs << 13; rs ^= rs >> 7; rs ^= rs << 17; return rs; }
static long nodes;

static int negamax(const St *s, int alpha, int beta) {
  nodes++;
  if (!s->empties) return diff(s, s->turn);
  uint64_t h = hashOf(s); TT *e = &tt[h & ((1u << TTBITS) - 1)];
  int a0 = alpha;
  if (e->key == h) {
    if (e->flag == 0) return e->v;
    if (e->flag == 1 && e->v >= beta) return e->v;
    if (e->flag == 2 && e->v <= alpha) return e->v;
  }
  int me = s->turn; St ch[128]; int gain[128], n = 0;
  for (int hi = 0; hi < K; hi++) {
    if (s->used[me] >> hi & 1) continue;
    int dup = 0; for (int j = 0; j < hi; j++) if (!(s->used[me] >> j & 1) && !memcmp(s->hand[me][j], s->hand[me][hi], 4)) dup = 1;
    if (dup) continue;
    for (int c = 0; c < N * N; c++) if (s->own[c] < 0) { ch[n] = *s; play(&ch[n], hi, c); gain[n] = -diff(&ch[n], ch[n].turn); n++; }
  }
  int ord[128]; for (int i = 0; i < n; i++) ord[i] = i;
  for (int i = 1; i < n; i++) { int t = ord[i], j = i; while (j > 0 && gain[ord[j - 1]] < gain[t]) { ord[j] = ord[j - 1]; j--; } ord[j] = t; }
  int best = -99;
  for (int i = 0; i < n; i++) {
    int v = -negamax(&ch[ord[i]], -beta, -alpha);
    if (v > best) best = v; if (v > alpha) alpha = v; if (alpha >= beta) break;
  }
  e->key = h; e->v = best; e->flag = best <= a0 ? 2 : best >= beta ? 1 : 0;
  return best;
}

// Deal exactly like deal() in index.html, with a seeded RNG in place of Math.random.
static double urand(void) { return (rnd64() >> 11) * (1.0 / 9007199254740992.0); }
static void makeStone(int total, uint8_t s[4]) { memset(s, 0, 4); while (total > 0) { int d = (int)(urand() * 4); if (s[d] < 3) { s[d]++; total--; } } }
static void deal(St *s) {
  memset(s, 0, sizeof *s); memset(s->own, -1, 16); s->empties = N * N;
  int tot[8]; for (int i = 0; i < K; i++) tot[i] = 3 + (int)(urand() * 6);
  for (int i = 1; i < K; i++) { int t = tot[i], j = i; while (j > 0 && tot[j - 1] < t) { tot[j] = tot[j - 1]; j--; } tot[j] = t; }
  for (int p = 0; p < 2; p++) for (int i = 0; i < K; i++) makeStone(tot[i], s->hand[p][i]);
}

int main(int argc, char **argv) {
  for (int i = 0; i < 16; i++) for (int j = 0; j < 3; j++) for (int k = 0; k < 256; k++) Z[i][j][k] = rnd64();
  for (int p = 0; p < 2; p++) for (int j = 0; j < 8; j++) ZU[p][j] = rnd64();
  ZT = rnd64();
  if (argc > 1 && !strcmp(argv[1], "replay")) { // lines: N K | hands (2K x 4 digits) | moves "hi c" ... | final own (N*N of -1/0/1)
    int games = 0, bad = 0;
    while (scanf("%d %d", &N, &K) == 2) {
      St s; memset(&s, 0, sizeof s); memset(s.own, -1, 16); s.empties = N * N;
      for (int p = 0; p < 2; p++) for (int i = 0; i < K; i++) for (int d = 0; d < 4; d++) { int v; scanf("%d", &v); s.hand[p][i][d] = v; }
      int m; scanf("%d", &m);
      for (int i = 0; i < m; i++) { int hi, c; scanf("%d %d", &hi, &c); play(&s, hi, c); }
      int ok = 1; for (int i = 0; i < N * N; i++) { int o; scanf("%d", &o); if (o != s.own[i]) ok = 0; }
      for (int i = 0; i < N * N; i++) for (int d = 0; d < 4; d++) { int v; scanf("%d", &v); if (s.own[i] >= 0 && v != s.sp[i][d]) ok = 0; }
      games++; bad += !ok;
    }
    printf("replayed %d games, %d mismatches\n", games, bad);
    return bad != 0;
  }
  N = atoi(argv[2]); K = N == 3 ? 5 : 8; int count = atoi(argv[3]); rs ^= strtoull(argv[4], 0, 10) * 0x9E3779B97F4A7C15ULL; rnd64();
  int roots = argc > 5;
  tt = calloc(1u << TTBITS, sizeof(TT));
  for (int g = 0; g < count; g++) {
    St s; deal(&s); memset(tt, 0, (1u << TTBITS) * sizeof(TT)); nodes = 0;
    int v = negamax(&s, -99, 99);
    printf("%d %d %ld", g, v, nodes);
    if (roots) { // exact value of every opening (stone, square) for the first player
      for (int hi = 0; hi < K; hi++) for (int c = 0; c < N * N; c++) { St t = s; play(&t, hi, c); printf(" %d", -negamax(&t, -99, 99)); }
    }
    printf(" |");
    for (int p = 0; p < 2; p++) for (int i = 0; i < K; i++) printf(" %d%d%d%d", s.hand[p][i][0], s.hand[p][i][1], s.hand[p][i][2], s.hand[p][i][3]);
    printf("\n"); fflush(stdout);
  }
  return 0;
}
