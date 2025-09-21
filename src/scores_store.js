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

  async getScores(assignmentId) {
    const scores = await this.#store.list({ prefix: [assignmentId] });
    return (await Array.fromAsync(scores)).map(r => r.value);
  }

  static async create() {
    const kv = await Deno.openKv("./scores_db");
    return new ScoresStore(kv);
  }
}
