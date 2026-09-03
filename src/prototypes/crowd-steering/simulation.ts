import { createAgent, type SteeringAgent, type Vector2 } from "./agent";
import { calculateSeek, calculateSeparation, clampMagnitude } from "./steering";

export interface SteeringSettings {
  agentCount: number;
  maxSpeed: number;
  maxForce: number;
  seekWeight: number;
  separationWeight: number;
  neighborRadius: number;
  separationEnabled: boolean;
}

export class CrowdSteeringSimulation {
  agents: SteeringAgent[] = [];
  target: Vector2;
  selectedAgentId?: number;
  hoveredAgentId?: number;
  private nextAgentId = 1;

  constructor(
    readonly width: number,
    readonly height: number,
    public settings: SteeringSettings,
  ) {
    this.target = { x: width * 0.78, y: height * 0.5 };
    this.reset();
  }

  reset() {
    this.nextAgentId = 1;
    this.target = { x: this.width * 0.78, y: this.height * 0.5 };
    this.agents = [];
    this.setAgentCount(this.settings.agentCount);
    this.selectedAgentId = this.agents[0]?.id;
    this.hoveredAgentId = undefined;
  }

  setAgentCount(count: number) {
    this.settings.agentCount = count;
    while (this.agents.length < count) {
      this.agents.push(this.spawnAgent());
    }
    this.agents.length = count;
    if (!this.agents.some((agent) => agent.id === this.selectedAgentId)) {
      this.selectedAgentId = this.agents[0]?.id;
    }
  }

  setTarget(target: Vector2) {
    this.target = {
      x: Math.max(18, Math.min(this.width - 18, target.x)),
      y: Math.max(18, Math.min(this.height - 18, target.y)),
    };
  }

  agentAt(position: Vector2, radius = 13) {
    let closest: SteeringAgent | undefined;
    let closestDistance = radius;
    for (const agent of this.agents) {
      const distance = Math.hypot(agent.position.x - position.x, agent.position.y - position.y);
      if (distance < closestDistance) {
        closest = agent;
        closestDistance = distance;
      }
    }
    return closest;
  }

  selectedAgent() {
    return this.agents.find((agent) => agent.id === this.selectedAgentId);
  }

  step(deltaTime: number) {
    const nextStates = this.agents.map((agent) => {
      const seek = calculateSeek(
        agent.position,
        agent.velocity,
        this.target,
        this.settings.maxSpeed,
      );
      const separationQuery = calculateSeparation(
        agent,
        this.agents,
        this.settings.neighborRadius,
        this.settings.maxSpeed,
      );
      const separationSteering = this.settings.separationEnabled
        ? separationQuery.steering
        : { x: 0, y: 0 };

      const weightedSteering = {
        x: seek.steering.x * this.settings.seekWeight
          + separationSteering.x * this.settings.separationWeight,
        y: seek.steering.y * this.settings.seekWeight
          + separationSteering.y * this.settings.separationWeight,
      };
      // maxForce limits how quickly competing behaviors can redirect an Agent,
      // preventing one close neighbor from causing an arbitrarily large change.
      const finalSteering = clampMagnitude(weightedSteering, this.settings.maxForce);
      const velocity = clampMagnitude({
        x: agent.velocity.x + finalSteering.x * deltaTime,
        y: agent.velocity.y + finalSteering.y * deltaTime,
      }, this.settings.maxSpeed);
      const position = {
        x: agent.position.x + velocity.x * deltaTime,
        y: agent.position.y + velocity.y * deltaTime,
      };
      this.contain(position, velocity, agent.radius);

      return {
        position,
        velocity,
        debug: {
          desiredVelocity: seek.desiredVelocity,
          seek: seek.steering,
          separation: separationSteering,
          finalSteering,
          neighborCount: separationQuery.neighborCount,
        },
      };
    });

    this.agents.forEach((agent, index) => {
      Object.assign(agent, nextStates[index]);
    });
  }

  private spawnAgent() {
    const centerX = this.width * 0.27;
    const centerY = this.height * 0.5;
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.sqrt(Math.random()) * Math.min(this.width, this.height) * 0.23;
    return createAgent(this.nextAgentId++, {
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
    });
  }

  private contain(position: Vector2, velocity: Vector2, radius: number) {
    const minimumX = radius;
    const maximumX = this.width - radius;
    const minimumY = radius;
    const maximumY = this.height - radius;
    if (position.x < minimumX || position.x > maximumX) {
      position.x = Math.max(minimumX, Math.min(maximumX, position.x));
      velocity.x = 0;
    }
    if (position.y < minimumY || position.y > maximumY) {
      position.y = Math.max(minimumY, Math.min(maximumY, position.y));
      velocity.y = 0;
    }
  }
}
