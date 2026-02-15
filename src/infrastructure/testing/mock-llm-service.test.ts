import { describe, it, expect, beforeEach } from 'vitest'
import { MockLLMService } from './mock-llm-service.js'
import { Tag, Suggestion, TagCategory, LLMServiceError } from '../../domain/index.js'

describe('MockLLMService', () => {
  let service: MockLLMService

  beforeEach(() => {
    service = new MockLLMService()
  })

  describe('generateTags', () => {
    it('should return default tags', async () => {
      const tags = await service.generateTags('Test idea', [])

      expect(tags).toHaveLength(6)
      expect(tags.some((t) => t.category.value === 'DOMAIN')).toBe(true)
      expect(tags.some((t) => t.category.value === 'SCALE')).toBe(true)
    })

    it('should return custom tags when configured', async () => {
      const customTags = [
        Tag.create('Custom', TagCategory.domain()),
        Tag.create('Small', TagCategory.scale()),
      ]
      service.setOptions({ customTags })

      const tags = await service.generateTags('Test idea', [])

      expect(tags).toHaveLength(2)
      expect(tags[0].name).toBe('Custom')
    })

    it('should throw error when configured to fail', async () => {
      service.setShouldFail(true, 'Test error message')

      await expect(service.generateTags('Test idea', [])).rejects.toThrow(
        LLMServiceError
      )
    })

    it('should track call arguments', async () => {
      await service.generateTags('My test idea', [])

      const args = service.getLastGenerateTagsArgs()

      expect(args).not.toBeNull()
      expect(args?.ideaContent).toBe('My test idea')
      expect(args?.chunks).toHaveLength(0)
    })
  })

  describe('generateSuggestion', () => {
    it('should return default suggestion', async () => {
      const suggestion = await service.generateSuggestion('Test idea', [], [])

      expect(suggestion.content).toContain('proof of concept')
      expect(suggestion.reasoning).toBeTruthy()
    })

    it('should return custom suggestion when configured', async () => {
      const customSuggestion = Suggestion.create(
        'Custom suggestion',
        'Custom reasoning'
      )
      service.setOptions({ customSuggestion })

      const suggestion = await service.generateSuggestion('Test idea', [], [])

      expect(suggestion.content).toBe('Custom suggestion')
      expect(suggestion.reasoning).toBe('Custom reasoning')
    })

    it('should throw error when configured to fail', async () => {
      service.setShouldFail(true)

      await expect(service.generateSuggestion('Test idea', [], [])).rejects.toThrow(
        LLMServiceError
      )
    })

    it('should track call arguments', async () => {
      const tag = Tag.create('Web', TagCategory.domain())
      await service.generateSuggestion('My idea', [], [tag])

      const args = service.getLastGenerateSuggestionArgs()

      expect(args).not.toBeNull()
      expect(args?.ideaContent).toBe('My idea')
      expect(args?.tags).toHaveLength(1)
    })
  })

  describe('checkConnection', () => {
    it('should return true when not failing', async () => {
      const result = await service.checkConnection()

      expect(result).toBe(true)
    })

    it('should return false when configured to fail', async () => {
      service.setShouldFail(true)

      const result = await service.checkConnection()

      expect(result).toBe(false)
    })
  })

  describe('call tracking', () => {
    it('should track call count', async () => {
      expect(service.getCallCount()).toBe(0)

      await service.generateTags('Idea 1', [])
      expect(service.getCallCount()).toBe(1)

      await service.generateSuggestion('Idea 2', [], [])
      expect(service.getCallCount()).toBe(2)
    })

    it('should reset all tracking state', async () => {
      await service.generateTags('Test', [])
      await service.generateSuggestion('Test', [], [])

      service.reset()

      expect(service.getCallCount()).toBe(0)
      expect(service.getLastGenerateTagsArgs()).toBeNull()
      expect(service.getLastGenerateSuggestionArgs()).toBeNull()
    })
  })
})
