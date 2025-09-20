export default class BatchWorker {
  constructor(src, timeoutDuration = 0) {
    this.src = src;
    this.jobs = [];
    this.results = [];
    this.initWorker();
    this.onDone = null;
    this.timeoutDuration = timeoutDuration;
  }

  initWorker() {
    const workerUrl = new URL(this.src, import.meta.url);
    this.worker = new Worker(workerUrl, { type: "module" });
    this.attachListener(this.worker);
  }

  attachListener(worker) {
    worker.addEventListener("message", (event) => {
      this.results.push(event.data);
      this.timeout && clearTimeout(this.timeout);
      this.process();
    });
  }

  queue(jobs, onDone) {
    this.jobs = jobs;
    this.results = [];
    this.onDone = onDone;
    this.process();
  }

  setWorkerTimeout(job, timeoutDuration) {
    this.timeout = setTimeout(() => {
      this.results.push({
        error: "timed out",
        timeoutDuration,
        name: job.name,
        job,
      });
      this.worker.terminate();
      this.initWorker();
      this.process(timeoutDuration);
    }, timeoutDuration);
  }

  process() {
    if (this.jobs.length === 0) {
      this.onDone(this.results);
      return;
    }

    const job = this.jobs.shift();
    if (job) {
      if (this.timeoutDuration > 0) {
        this.setWorkerTimeout(job, this.timeoutDuration);
      }
      this.worker.postMessage(job);
    }
  }
}
