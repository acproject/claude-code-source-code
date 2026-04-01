import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { logEvent } from 'src/services/analytics/index.js'
import { Spinner } from '../components/Spinner.js'
import { getOauthConfig } from '../constants/oauth.js'
import { useTimeout } from '../hooks/useTimeout.js'
import { Box, Text } from '../ink.js'
import { getSSLErrorHint } from '../services/api/errorUtils.js'
import { isEnvTruthy } from './envUtils.js'
import { getUserAgent } from './http.js'
import { logError } from './log.js'

const DEFAULT_TIMEOUT_MS = 10_000

export interface PreflightCheckResult {
  success: boolean
  error?: string
  sslHint?: string
}

export function isPreflightCheckEnabled(): boolean {
  return isEnvTruthy(process.env.CLAUDE_CODE_ENABLE_PREFLIGHT_CHECK)
}

function getPreflightCheckEndpoints(): string[] {
  const configured = process.env.CLAUDE_CODE_PREFLIGHT_ENDPOINTS?.trim()
  if (configured) {
    return configured
      .split(/[\n,]/)
      .map(endpoint => endpoint.trim())
      .filter(Boolean)
  }

  const oauthConfig = getOauthConfig()
  const tokenUrl = new URL(oauthConfig.TOKEN_URL)

  return [
    `${oauthConfig.BASE_API_URL}/api/hello`,
    `${tokenUrl.origin}/v1/oauth/hello`,
  ]
}

function getPreflightTimeoutMs(): number {
  const configured = Number(process.env.CLAUDE_CODE_PREFLIGHT_TIMEOUT_MS)
  return Number.isFinite(configured) && configured > 0
    ? configured
    : DEFAULT_TIMEOUT_MS
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.code || error.message
  }
  if (error instanceof Error) {
    return (error as NodeJS.ErrnoException).code || error.message
  }
  return String(error)
}

async function checkEndpoints(): Promise<PreflightCheckResult> {
  try {
    const timeout = getPreflightTimeoutMs()
    const endpoints = getPreflightCheckEndpoints()

    const checkEndpoint = async (url: string): Promise<PreflightCheckResult> => {
      try {
        const response = await axios.get(url, {
          headers: {
            'User-Agent': getUserAgent(),
          },
          timeout,
          validateStatus: () => true,
        })

        if (response.status < 200 || response.status >= 400) {
          const hostname = new URL(url).hostname
          return {
            success: false,
            error: `Failed to connect to ${hostname}: Status ${response.status}`,
          }
        }

        return { success: true }
      } catch (error) {
        const hostname = new URL(url).hostname
        const sslHint = getSSLErrorHint(error)
        return {
          success: false,
          error: `Failed to connect to ${hostname}: ${getErrorMessage(error)}`,
          sslHint: sslHint ?? undefined,
        }
      }
    }

    const results = await Promise.all(endpoints.map(checkEndpoint))
    const failedResult = results.find(result => !result.success)

    if (failedResult) {
      logEvent('tengu_preflight_check_failed', {
        isConnectivityError: false,
        hasErrorMessage: !!failedResult.error,
        isSSLError: !!failedResult.sslHint,
      })
    }

    return failedResult || { success: true }
  } catch (error) {
    logError(error as Error)
    logEvent('tengu_preflight_check_failed', {
      isConnectivityError: true,
    })
    return {
      success: false,
      error: `Connectivity check error: ${getErrorMessage(error)}`,
    }
  }
}

interface PreflightStepProps {
  onSuccess: () => void
}

export function PreflightStep({
  onSuccess,
}: PreflightStepProps): React.ReactNode {
  const [result, setResult] = useState<null | PreflightCheckResult>(null)
  const [isChecking, setIsChecking] = useState(true)
  const showSpinner = useTimeout(1000) && isChecking

  useEffect(() => {
    let isMounted = true

    void checkEndpoints().then(checkResult => {
      if (!isMounted) return
      setResult(checkResult)
      setIsChecking(false)
    })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (result?.success) {
      onSuccess()
      return
    }

    if (result && !result.success) {
      const timer = setTimeout(() => process.exit(1), 100)
      return () => clearTimeout(timer)
    }
  }, [result, onSuccess])

  let content: React.ReactNode = null

  if (isChecking && showSpinner) {
    content = (
      <Box paddingLeft={1}>
        <Spinner />
        <Text>Checking connectivity...</Text>
      </Box>
    )
  } else if (!result?.success && !isChecking) {
    content = (
      <Box flexDirection="column" gap={1}>
        <Text color="error">Unable to connect to configured services</Text>
        <Text color="error">{result?.error}</Text>
        {result?.sslHint ? (
          <Box flexDirection="column" gap={1}>
            <Text>{result.sslHint}</Text>
            <Text color="suggestion">
              See https://code.claude.com/docs/en/network-config
            </Text>
          </Box>
        ) : (
          <Box flexDirection="column" gap={1}>
            <Text>Please check your internet connection and network settings.</Text>
            <Text>
              Note: Claude Code might not be available in your country. Check
              supported countries at{' '}
              <Text color="suggestion">
                https://anthropic.com/supported-countries
              </Text>
            </Text>
          </Box>
        )}
      </Box>
    )
  }

  return (
    <Box flexDirection="column" gap={1} paddingLeft={1}>
      {content}
    </Box>
  )
}
