import type { IIdeaRepository, ListIdeasOptions } from '../../domain/interfaces/index.js'
import type { Idea, IdeaId } from '../../domain/index.js'

export class MockIdeaRepository implements IIdeaRepository {
  private ideas: Map<string, Idea> = new Map()

  async save(idea: Idea): Promise<void> {
    this.ideas.set(idea.id.value, idea)
  }

  async findById(id: IdeaId): Promise<Idea | null> {
    return this.ideas.get(id.value) ?? null
  }

  async findAll(options?: ListIdeasOptions): Promise<readonly Idea[]> {
    let ideas = Array.from(this.ideas.values())

    if (options?.archivedOnly) {
      ideas = ideas.filter((idea) => idea.isArchived())
    } else if (!options?.includeArchived) {
      ideas = ideas.filter((idea) => !idea.isArchived())
    }

    ideas.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    if (options?.limit) {
      ideas = ideas.slice(0, options.limit)
    }

    return ideas
  }

  async findAllActive(options?: ListIdeasOptions): Promise<readonly Idea[]> {
    return this.findAll({ ...options, archivedOnly: false, includeArchived: false })
  }

  async findAllArchived(options?: ListIdeasOptions): Promise<readonly Idea[]> {
    return this.findAll({ ...options, archivedOnly: true })
  }

  async findByTags(
    tags: readonly string[],
    options?: ListIdeasOptions
  ): Promise<readonly Idea[]> {
    if (tags.length === 0) {
      return this.findAll(options)
    }

    let ideas = Array.from(this.ideas.values())

    ideas = ideas.filter((idea) =>
      tags.every((tagName) => idea.tags.some((t) => t.name === tagName))
    )

    if (options?.archivedOnly) {
      ideas = ideas.filter((idea) => idea.isArchived())
    } else if (!options?.includeArchived) {
      ideas = ideas.filter((idea) => !idea.isArchived())
    }

    ideas.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    if (options?.limit) {
      ideas = ideas.slice(0, options.limit)
    }

    return ideas
  }

  async update(idea: Idea): Promise<void> {
    if (!this.ideas.has(idea.id.value)) {
      throw new Error(`Idea with id ${idea.id.value} not found`)
    }
    this.ideas.set(idea.id.value, idea)
  }

  clear(): void {
    this.ideas.clear()
  }

  getAll(): readonly Idea[] {
    return Array.from(this.ideas.values())
  }

  count(): number {
    return this.ideas.size
  }
}
