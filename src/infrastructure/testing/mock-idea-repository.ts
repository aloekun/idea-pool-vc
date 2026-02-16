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
    const ideas = Array.from(this.ideas.values())
    return this.applyFilters(ideas, options)
  }

  async findAllActive(options?: ListIdeasOptions): Promise<readonly Idea[]> {
    return this.findAll({ ...options, archiveFilter: 'active' })
  }

  async findAllArchived(options?: ListIdeasOptions): Promise<readonly Idea[]> {
    return this.findAll({ ...options, archiveFilter: 'archived' })
  }

  async findByTags(
    tags: readonly string[],
    options?: ListIdeasOptions
  ): Promise<readonly Idea[]> {
    if (tags.length === 0) {
      return this.findAll(options)
    }

    const ideas = Array.from(this.ideas.values()).filter((idea) =>
      tags.every((tagName) => idea.tags.some((t) => t.name === tagName))
    )

    return this.applyFilters(ideas, options)
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

  private applyFilters(
    ideas: Idea[],
    options?: ListIdeasOptions
  ): readonly Idea[] {
    let filtered = [...ideas]

    const archiveFilter = options?.archiveFilter ?? 'active'
    if (archiveFilter === 'archived') {
      filtered = filtered.filter((idea) => idea.isArchived())
    } else if (archiveFilter === 'active') {
      filtered = filtered.filter((idea) => !idea.isArchived())
    }

    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    if (options?.limit) {
      filtered = filtered.slice(0, options.limit)
    }

    return filtered
  }
}
