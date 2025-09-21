export default class ScoresStore {
  #store;
  constructor(store) {
    this.#store = store;
  }

  addScores(assignmentId, scores) {
    return Promise.all(
      scores.map((score) => this.#store.set([assignmentId, score.name], score)),
    );
  }

  addStats(assignmentId, stats) {
    return this.#store.set(["stats", assignmentId], stats);
  }

  getStats(assignmentId) {
    return this.#store.get(["stats", assignmentId]).then((r) => r.value);
  }

  async getScores(assignmentId) {
    const scores = await this.#store.list({ prefix: [assignmentId] });
    return (await Array.fromAsync(scores)).map((r) => r.value);
  }

  async getAssignmentStats(assignmentIds) {
    const scores = await Array.fromAsync(
      await this.#store.list({ prefix: ["stats"] }),
    );
    return scores
      .filter((r) => assignmentIds.includes(r.value.name))
      .map((r) => r.value);
  }

  static async create() {
    const kv = await Deno.openKv();
    return new ScoresStore(kv);
  }
}
