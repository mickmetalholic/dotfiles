#
# Copyright (c) Microsoft. All rights reserved.
# Licensed under the MIT license. See LICENSE file in the project root for full license information.
#

function ConvertTo-ScriptExtent {
    <#
    .EXTERNALHELP ..\PowerShellEditorServices.Commands-help.xml
    #>
    [CmdletBinding()]
    [OutputType([System.Management.Automation.Language.IScriptExtent])]
    param(
        [Parameter(Mandatory, ValueFromPipelineByPropertyName, ParameterSetName='ByOffset')]
        [Alias('StartOffset', 'Offset')]
        [int]
        $StartOffsetNumber,

        [Parameter(ValueFromPipelineByPropertyName, ParameterSetName='ByOffset')]
        [Alias('EndOffset')]
        [int]
        $EndOffsetNumber,

        [Parameter(ValueFromPipelineByPropertyName, ParameterSetName='ByPosition')]
        [Alias('StartLine', 'Line')]
        [int]
        $StartLineNumber,

        [Parameter(ValueFromPipelineByPropertyName, ParameterSetName='ByPosition')]
        [Alias('StartColumn', 'Column')]
        [int]
        $StartColumnNumber,

        [Parameter(ValueFromPipelineByPropertyName, ParameterSetName='ByPosition')]
        [Alias('EndLine')]
        [int]
        $EndLineNumber,

        [Parameter(ValueFromPipelineByPropertyName, ParameterSetName='ByPosition')]
        [Alias('EndColumn')]
        [int]
        $EndColumnNumber,

        [Parameter(ValueFromPipelineByPropertyName, ParameterSetName='ByPosition')]
        [Parameter(ValueFromPipelineByPropertyName, ParameterSetName='ByOffset')]
        [Parameter(ValueFromPipelineByPropertyName, ParameterSetName='ByBuffer')]
        [Alias('File', 'FileName')]
        [string]
        $FilePath = $psEditor.GetEditorContext().CurrentFile.Path,

        [Parameter(ValueFromPipelineByPropertyName, ParameterSetName='ByBuffer')]
        [Alias('Start')]
        [Microsoft.PowerShell.EditorServices.BufferPosition]
        $StartBuffer,

        [Parameter(ValueFromPipelineByPropertyName, ParameterSetName='ByBuffer')]
        [Alias('End')]
        [Microsoft.PowerShell.EditorServices.BufferPosition]
        $EndBuffer,

        [Parameter(Mandatory,
                   ValueFromPipeline,
                   ValueFromPipelineByPropertyName,
                   ParameterSetName='ByExtent')]
        [System.Management.Automation.Language.IScriptExtent]
        $Extent
    )
    begin {
        $fileContext = $psEditor.GetEditorContext().CurrentFile
        $emptyExtent = New-Object Microsoft.PowerShell.EditorServices.FullScriptExtent @(
            <# filecontext: #> $fileContext,
            <# startOffset: #> 0,
            <# endOffset:   #> 0)
    }
    process {
        # Already a InternalScriptExtent, FullScriptExtent or is empty.
        $returnAsIs = $Extent -and
                     (0 -ne $Extent.StartOffset   -or
                      0 -ne $Extent.EndOffset     -or
                      $Extent -eq $emptyExtent)

        if ($returnAsIs) { return $Extent }

        if ($StartOffsetNumber) {
            $startOffset = $StartOffsetNumber
            $endOffset   = $EndOffsetNumber

            # Allow creating a single position extent with just the offset parameter.
            if (-not $EndOffsetNumber) {
                $endOffset = $startOffset
            }
            return New-Object Microsoft.PowerShell.EditorServices.FullScriptExtent @(
                $fileContext,
                $startOffset,
                $endOffset)
        }
        if (-not $StartBuffer) {
            if (-not $StartColumnNumber) { $StartColumnNumber = 1 }
            if (-not $StartLineNumber)   { $StartLineNumber   = 1 }
            $StartBuffer = New-Object Microsoft.PowerShell.EditorServices.BufferPosition @(
                $StartLineNumber,
                $StartColumnNumber)

            if ($EndLineNumber -and $EndColumnNumber) {
                $EndBuffer = New-Object Microsoft.PowerShell.EditorServices.BufferPosition @(
                    $EndLineNumber,
                    $EndColumnNumber)
            }
        }
        if (-not $EndBuffer) { $EndBuffer = $StartBuffer }

        $bufferRange = New-Object Microsoft.PowerShell.EditorServices.BufferRange @(
            $StartBuffer,
            $EndBuffer)

        return New-Object Microsoft.PowerShell.EditorServices.FullScriptExtent @(
            $fileContext,
            $bufferRange)
    }
}

# SIG # Begin signature block
# MIIjiQYJKoZIhvcNAQcCoIIjejCCI3YCAQExDzANBglghkgBZQMEAgEFADB5Bgor
# BgEEAYI3AgEEoGswaTA0BgorBgEEAYI3AgEeMCYCAwEAAAQQH8w7YFlLCE63JNLG
# KX7zUQIBAAIBAAIBAAIBAAIBADAxMA0GCWCGSAFlAwQCAQUABCCfUBo2N/xeTlj8
# OfgkR2K0PeT+yIAJVEqu3DT/hVBCdKCCDYUwggYDMIID66ADAgECAhMzAAABBGni
# 27n7ig2DAAAAAAEEMA0GCSqGSIb3DQEBCwUAMH4xCzAJBgNVBAYTAlVTMRMwEQYD
# VQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVNaWNy
# b3NvZnQgQ29ycG9yYXRpb24xKDAmBgNVBAMTH01pY3Jvc29mdCBDb2RlIFNpZ25p
# bmcgUENBIDIwMTEwHhcNMTgwNzEyMjAwODQ5WhcNMTkwNzI2MjAwODQ5WjB0MQsw
# CQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9u
# ZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMR4wHAYDVQQDExVNaWNy
# b3NvZnQgQ29ycG9yYXRpb24wggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIB
# AQCbxZXyl/b/I2psnXNZczib07TjhK2NuD4l56C4IFpKkXA42BSovZrA/Q1rHuzh
# /P8EPOJhYK5VamGS+9cAfZ7qaTbW/Vd5GZf+hJH2x1Wtpq4Ciu2xkUdWzUqHZkWn
# MBsa7ax7awXSM4JzvsZvHMzU6BoFFQAukZe2S8hhZyKL5xMSaMIXFK8mWrbuVXN8
# 9USzIScGAOu1Nvn8JoqtP39EFMN6uyPIi96+ForBIaICAdl/mJLiMVOPh7GQJJsX
# +hVNygFsEGxSAqKTX2IDQSSMcKdwLI1LL9czWVz9XeA/1+SEF7t9PnnTgkNiVEDI
# m17PcBQ7YDxpP5835/gWkjOLAgMBAAGjggGCMIIBfjAfBgNVHSUEGDAWBgorBgEE
# AYI3TAgBBggrBgEFBQcDAzAdBgNVHQ4EFgQUuhfjJWj0u9V7I6a4tnznpoKrV64w
# VAYDVR0RBE0wS6RJMEcxLTArBgNVBAsTJE1pY3Jvc29mdCBJcmVsYW5kIE9wZXJh
# dGlvbnMgTGltaXRlZDEWMBQGA1UEBRMNMjMwMDEyKzQzNzk2NjAfBgNVHSMEGDAW
# gBRIbmTlUAXTgqoXNzcitW2oynUClTBUBgNVHR8ETTBLMEmgR6BFhkNodHRwOi8v
# d3d3Lm1pY3Jvc29mdC5jb20vcGtpb3BzL2NybC9NaWNDb2RTaWdQQ0EyMDExXzIw
# MTEtMDctMDguY3JsMGEGCCsGAQUFBwEBBFUwUzBRBggrBgEFBQcwAoZFaHR0cDov
# L3d3dy5taWNyb3NvZnQuY29tL3BraW9wcy9jZXJ0cy9NaWNDb2RTaWdQQ0EyMDEx
# XzIwMTEtMDctMDguY3J0MAwGA1UdEwEB/wQCMAAwDQYJKoZIhvcNAQELBQADggIB
# ACnFggs5mSAM6CRbiTs4UJKDlduR8jvSpPDagVtzjmdIGrbJigd5WmzOw/xmmBey
# u9emFrUDVoV7Kn0vQAZOnmnXaRQVjmP7zID12xGcUO5LAnFMawcF/mdT8Rm2bm4s
# 8o/URSnhNgiyHHiBJ5aHmUIYd5TcxrydpNtWpjbQQ0hfQAR+Z+mI2ADH6zL/3gp3
# YANz/p6hxx3zwLMtYYfI8TeF3PxtPEsTShJ2tVBKTedd808h5JgSgYH+6Vyo/BSM
# 0QKfZft2dbdiU8d92se6QuJueyZKI4Iy2I11HhFvi396BtWqHxilcBPn7midB7wG
# 6YkDlgxq4iGrJQPYtwER4cQilikxfMNVTtAc50XGZgCKFSHExQFwHeJoATkPIiHJ
# qHN/cNgs9PVp5UlsOaWiqcp7OdX5d28wc4OWwKOLruV/3WNN2hXLe/kd5Y7EOqpK
# 9C1FZp/yXrhJFznj3x1JiWGLujOvXkLqGtT1UVPxpV2Sm4dnuHarBlXhrtWDrzn/
# IDGLXOb6tQfPhifHQQIjOW1ZTi7AeK86SWNs4njgI3bUK6hnADxlUlgw0njpeO3t
# uyl9oh845exZx5OZRfkAiMpEekfWJkfN1AnCtXqQDD0WFn63lNtGUgBKHrk9aclR
# ZWrVPxHELTeXX5LCDTEMmtZZd/BQSIeJdpPY831KsCLYMIIHejCCBWKgAwIBAgIK
# YQ6Q0gAAAAAAAzANBgkqhkiG9w0BAQsFADCBiDELMAkGA1UEBhMCVVMxEzARBgNV
# BAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jv
# c29mdCBDb3Jwb3JhdGlvbjEyMDAGA1UEAxMpTWljcm9zb2Z0IFJvb3QgQ2VydGlm
# aWNhdGUgQXV0aG9yaXR5IDIwMTEwHhcNMTEwNzA4MjA1OTA5WhcNMjYwNzA4MjEw
# OTA5WjB+MQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UE
# BxMHUmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMSgwJgYD
# VQQDEx9NaWNyb3NvZnQgQ29kZSBTaWduaW5nIFBDQSAyMDExMIICIjANBgkqhkiG
# 9w0BAQEFAAOCAg8AMIICCgKCAgEAq/D6chAcLq3YbqqCEE00uvK2WCGfQhsqa+la
# UKq4BjgaBEm6f8MMHt03a8YS2AvwOMKZBrDIOdUBFDFC04kNeWSHfpRgJGyvnkmc
# 6Whe0t+bU7IKLMOv2akrrnoJr9eWWcpgGgXpZnboMlImEi/nqwhQz7NEt13YxC4D
# dato88tt8zpcoRb0RrrgOGSsbmQ1eKagYw8t00CT+OPeBw3VXHmlSSnnDb6gE3e+
# lD3v++MrWhAfTVYoonpy4BI6t0le2O3tQ5GD2Xuye4Yb2T6xjF3oiU+EGvKhL1nk
# kDstrjNYxbc+/jLTswM9sbKvkjh+0p2ALPVOVpEhNSXDOW5kf1O6nA+tGSOEy/S6
# A4aN91/w0FK/jJSHvMAhdCVfGCi2zCcoOCWYOUo2z3yxkq4cI6epZuxhH2rhKEmd
# X4jiJV3TIUs+UsS1Vz8kA/DRelsv1SPjcF0PUUZ3s/gA4bysAoJf28AVs70b1FVL
# 5zmhD+kjSbwYuER8ReTBw3J64HLnJN+/RpnF78IcV9uDjexNSTCnq47f7Fufr/zd
# sGbiwZeBe+3W7UvnSSmnEyimp31ngOaKYnhfsi+E11ecXL93KCjx7W3DKI8sj0A3
# T8HhhUSJxAlMxdSlQy90lfdu+HggWCwTXWCVmj5PM4TasIgX3p5O9JawvEagbJjS
# 4NaIjAsCAwEAAaOCAe0wggHpMBAGCSsGAQQBgjcVAQQDAgEAMB0GA1UdDgQWBBRI
# bmTlUAXTgqoXNzcitW2oynUClTAZBgkrBgEEAYI3FAIEDB4KAFMAdQBiAEMAQTAL
# BgNVHQ8EBAMCAYYwDwYDVR0TAQH/BAUwAwEB/zAfBgNVHSMEGDAWgBRyLToCMZBD
# uRQFTuHqp8cx0SOJNDBaBgNVHR8EUzBRME+gTaBLhklodHRwOi8vY3JsLm1pY3Jv
# c29mdC5jb20vcGtpL2NybC9wcm9kdWN0cy9NaWNSb29DZXJBdXQyMDExXzIwMTFf
# MDNfMjIuY3JsMF4GCCsGAQUFBwEBBFIwUDBOBggrBgEFBQcwAoZCaHR0cDovL3d3
# dy5taWNyb3NvZnQuY29tL3BraS9jZXJ0cy9NaWNSb29DZXJBdXQyMDExXzIwMTFf
# MDNfMjIuY3J0MIGfBgNVHSAEgZcwgZQwgZEGCSsGAQQBgjcuAzCBgzA/BggrBgEF
# BQcCARYzaHR0cDovL3d3dy5taWNyb3NvZnQuY29tL3BraW9wcy9kb2NzL3ByaW1h
# cnljcHMuaHRtMEAGCCsGAQUFBwICMDQeMiAdAEwAZQBnAGEAbABfAHAAbwBsAGkA
# YwB5AF8AcwB0AGEAdABlAG0AZQBuAHQALiAdMA0GCSqGSIb3DQEBCwUAA4ICAQBn
# 8oalmOBUeRou09h0ZyKbC5YR4WOSmUKWfdJ5DJDBZV8uLD74w3LRbYP+vj/oCso7
# v0epo/Np22O/IjWll11lhJB9i0ZQVdgMknzSGksc8zxCi1LQsP1r4z4HLimb5j0b
# pdS1HXeUOeLpZMlEPXh6I/MTfaaQdION9MsmAkYqwooQu6SpBQyb7Wj6aC6VoCo/
# KmtYSWMfCWluWpiW5IP0wI/zRive/DvQvTXvbiWu5a8n7dDd8w6vmSiXmE0OPQvy
# CInWH8MyGOLwxS3OW560STkKxgrCxq2u5bLZ2xWIUUVYODJxJxp/sfQn+N4sOiBp
# mLJZiWhub6e3dMNABQamASooPoI/E01mC8CzTfXhj38cbxV9Rad25UAqZaPDXVJi
# hsMdYzaXht/a8/jyFqGaJ+HNpZfQ7l1jQeNbB5yHPgZ3BtEGsXUfFL5hYbXw3MYb
# BL7fQccOKO7eZS/sl/ahXJbYANahRr1Z85elCUtIEJmAH9AAKcWxm6U/RXceNcbS
# oqKfenoi+kiVH6v7RyOA9Z74v2u3S5fi63V4GuzqN5l5GEv/1rMjaHXmr/r8i+sL
# gOppO6/8MO0ETI7f33VtY5E90Z1WTk+/gFcioXgRMiF670EKsT/7qMykXcGhiJtX
# cVZOSEXAQsmbdlsKgEhr/Xmfwb1tbWrJUnMTDXpQzTGCFVowghVWAgEBMIGVMH4x
# CzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRt
# b25kMR4wHAYDVQQKExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xKDAmBgNVBAMTH01p
# Y3Jvc29mdCBDb2RlIFNpZ25pbmcgUENBIDIwMTECEzMAAAEEaeLbufuKDYMAAAAA
# AQQwDQYJYIZIAWUDBAIBBQCgga4wGQYJKoZIhvcNAQkDMQwGCisGAQQBgjcCAQQw
# HAYKKwYBBAGCNwIBCzEOMAwGCisGAQQBgjcCARUwLwYJKoZIhvcNAQkEMSIEIGDv
# ZcOsnGyXfyqfVK2CJYwBztSLKkHaFKRCTE/IYHOSMEIGCisGAQQBgjcCAQwxNDAy
# oBSAEgBNAGkAYwByAG8AcwBvAGYAdKEagBhodHRwOi8vd3d3Lm1pY3Jvc29mdC5j
# b20wDQYJKoZIhvcNAQEBBQAEggEACenPxXg6b0BeuBFPEO8tQkMa5NTdHwCmEg80
# 7tBdy+9sdOAEWyCQqKBs+IiGjVh8kpZLua7pdErAerArcbROmA/qxV8Tg2V3j8GZ
# KoDe5Z/jWB5hSfM6FA+pQYtNFqfW2ke5N/tDA+neCyDVgaEM+I385irKiPLOk6d8
# 0imWLYCw+G4HXlrrUV5nr/+kCUUU13gSIXjr8W52RhITOh1cwm3HVilc4/loKBNl
# 8DZMf8ceMxIUIIcPXqKbwett69gdVlxAFbsQkdhEb6ZnsiZmoGWXRhp3JxqBEfMG
# KHUhnjcq39yjS95Y49XUCAOk8NGm09/GVsrRxvmTqinGWmpBLqGCEuQwghLgBgor
# BgEEAYI3AwMBMYIS0DCCEswGCSqGSIb3DQEHAqCCEr0wghK5AgEDMQ8wDQYJYIZI
# AWUDBAIBBQAwggFQBgsqhkiG9w0BCRABBKCCAT8EggE7MIIBNwIBAQYKKwYBBAGE
# WQoDATAxMA0GCWCGSAFlAwQCAQUABCC2jgfGNhh8KW+QkBkXxoQgITQZxjM3dAu5
# 4tbNSssPBwIGW/39JcWsGBIyMDE4MTIxOTAwNTIyMC40MVowBIACAfSggdCkgc0w
# gcoxCzAJBgNVBAYTAlVTMQswCQYDVQQIEwJXQTEQMA4GA1UEBxMHUmVkbW9uZDEe
# MBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMS0wKwYDVQQLEyRNaWNyb3Nv
# ZnQgSXJlbGFuZCBPcGVyYXRpb25zIExpbWl0ZWQxJjAkBgNVBAsTHVRoYWxlcyBU
# U1MgRVNOOkEyNDAtNEI4Mi0xMzBFMSUwIwYDVQQDExxNaWNyb3NvZnQgVGltZS1T
# dGFtcCBzZXJ2aWNloIIOPDCCBPEwggPZoAMCAQICEzMAAADgship1NHCtPcAAAAA
# AOAwDQYJKoZIhvcNAQELBQAwfDELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hp
# bmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jw
# b3JhdGlvbjEmMCQGA1UEAxMdTWljcm9zb2Z0IFRpbWUtU3RhbXAgUENBIDIwMTAw
# HhcNMTgwODIzMjAyNzAxWhcNMTkxMTIzMjAyNzAxWjCByjELMAkGA1UEBhMCVVMx
# CzAJBgNVBAgTAldBMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVNaWNyb3Nv
# ZnQgQ29ycG9yYXRpb24xLTArBgNVBAsTJE1pY3Jvc29mdCBJcmVsYW5kIE9wZXJh
# dGlvbnMgTGltaXRlZDEmMCQGA1UECxMdVGhhbGVzIFRTUyBFU046QTI0MC00Qjgy
# LTEzMEUxJTAjBgNVBAMTHE1pY3Jvc29mdCBUaW1lLVN0YW1wIHNlcnZpY2UwggEi
# MA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDCl/hnDsembJx7FMS5RuaJsiQJ
# DP0tiqyeCettiNlGcNoa428oVtblH6yZatCXZygyhzbnDJofTHIGtdiEzQc5fPhd
# dfTd4hEQgd5ch/BlGITXFEwJ4d/GhHZQ1hbLdiBT/j67Qx15VeuXy5n/jM9PvIbB
# ksSWwX8vrkhRT/rqa1xWrmF+SfcYKw+pC+d3tUHrgACo0YaVHuS3jlpXg33A+pul
# 8wibZBcGxMF1CqwlP0AfMW60Dp4qm/JLbWxdx/pOiiOrM/tykFDtEnN07HXRjXDh
# DhfIeBCz4GPiCEFk94AaFxysFeFn9vyz7TyKJxUksXJhtWGq2i4WmPcphyDzAgMB
# AAGjggEbMIIBFzAdBgNVHQ4EFgQUa0HTCrY5zqzv/p44rWuSbXaAh+gwHwYDVR0j
# BBgwFoAU1WM6XIoxkPNDe3xGG8UzaFqFbVUwVgYDVR0fBE8wTTBLoEmgR4ZFaHR0
# cDovL2NybC5taWNyb3NvZnQuY29tL3BraS9jcmwvcHJvZHVjdHMvTWljVGltU3Rh
# UENBXzIwMTAtMDctMDEuY3JsMFoGCCsGAQUFBwEBBE4wTDBKBggrBgEFBQcwAoY+
# aHR0cDovL3d3dy5taWNyb3NvZnQuY29tL3BraS9jZXJ0cy9NaWNUaW1TdGFQQ0Ff
# MjAxMC0wNy0wMS5jcnQwDAYDVR0TAQH/BAIwADATBgNVHSUEDDAKBggrBgEFBQcD
# CDANBgkqhkiG9w0BAQsFAAOCAQEACx/endmS5DW6xgb8fIdEqI963fUB7IoYlYNQ
# U/YZwq155uK1lwhcH5R1CaVMr+lyNIfD8l+lqy8mdou+Zwcrnzo3m2UEGO0uNFd4
# c8Iew5Z49V+6AojT6z5IGJh3y56uDACQzRZrR+26uCx1nLsYjK/WtxQDq1IHHWeA
# xfrGxsAZO1BdQo25Mx34ZseViVj+usfmy0nUmfvZ0hFcMeNd4i4Kds03kY/CwWVZ
# Bw62tAjOHK/c81wO7hiutu9JX4MNjaEuFdheiNwmHyAmbpqYmz6K+9IPM75iXELb
# zjDc6yLJpVOq17gfVDCaweryzgVnC2CIxq7gDGyTM9afwMtESTCCBnEwggRZoAMC
# AQICCmEJgSoAAAAAAAIwDQYJKoZIhvcNAQELBQAwgYgxCzAJBgNVBAYTAlVTMRMw
# EQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVN
# aWNyb3NvZnQgQ29ycG9yYXRpb24xMjAwBgNVBAMTKU1pY3Jvc29mdCBSb290IENl
# cnRpZmljYXRlIEF1dGhvcml0eSAyMDEwMB4XDTEwMDcwMTIxMzY1NVoXDTI1MDcw
# MTIxNDY1NVowfDELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAO
# BgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEm
# MCQGA1UEAxMdTWljcm9zb2Z0IFRpbWUtU3RhbXAgUENBIDIwMTAwggEiMA0GCSqG
# SIb3DQEBAQUAA4IBDwAwggEKAoIBAQCpHQ28dxGKOiDs/BOX9fp/aZRrdFQQ1aUK
# AIKF++18aEssX8XD5WHCdrc+Zitb8BVTJwQxH0EbGpUdzgkTjnxhMFmxMEQP8WCI
# hFRDDNdNuDgIs0Ldk6zWczBXJoKjRQ3Q6vVHgc2/JGAyWGBG8lhHhjKEHnRhZ5Ff
# gVSxz5NMksHEpl3RYRNuKMYa+YaAu99h/EbBJx0kZxJyGiGKr0tkiVBisV39dx89
# 8Fd1rL2KQk1AUdEPnAY+Z3/1ZsADlkR+79BL/W7lmsqxqPJ6Kgox8NpOBpG2iAg1
# 6HgcsOmZzTznL0S6p/TcZL2kAcEgCZN4zfy8wMlEXV4WnAEFTyJNAgMBAAGjggHm
# MIIB4jAQBgkrBgEEAYI3FQEEAwIBADAdBgNVHQ4EFgQU1WM6XIoxkPNDe3xGG8Uz
# aFqFbVUwGQYJKwYBBAGCNxQCBAweCgBTAHUAYgBDAEEwCwYDVR0PBAQDAgGGMA8G
# A1UdEwEB/wQFMAMBAf8wHwYDVR0jBBgwFoAU1fZWy4/oolxiaNE9lJBb186aGMQw
# VgYDVR0fBE8wTTBLoEmgR4ZFaHR0cDovL2NybC5taWNyb3NvZnQuY29tL3BraS9j
# cmwvcHJvZHVjdHMvTWljUm9vQ2VyQXV0XzIwMTAtMDYtMjMuY3JsMFoGCCsGAQUF
# BwEBBE4wTDBKBggrBgEFBQcwAoY+aHR0cDovL3d3dy5taWNyb3NvZnQuY29tL3Br
# aS9jZXJ0cy9NaWNSb29DZXJBdXRfMjAxMC0wNi0yMy5jcnQwgaAGA1UdIAEB/wSB
# lTCBkjCBjwYJKwYBBAGCNy4DMIGBMD0GCCsGAQUFBwIBFjFodHRwOi8vd3d3Lm1p
# Y3Jvc29mdC5jb20vUEtJL2RvY3MvQ1BTL2RlZmF1bHQuaHRtMEAGCCsGAQUFBwIC
# MDQeMiAdAEwAZQBnAGEAbABfAFAAbwBsAGkAYwB5AF8AUwB0AGEAdABlAG0AZQBu
# AHQALiAdMA0GCSqGSIb3DQEBCwUAA4ICAQAH5ohRDeLG4Jg/gXEDPZ2joSFvs+um
# zPUxvs8F4qn++ldtGTCzwsVmyWrf9efweL3HqJ4l4/m87WtUVwgrUYJEEvu5U4zM
# 9GASinbMQEBBm9xcF/9c+V4XNZgkVkt070IQyK+/f8Z/8jd9Wj8c8pl5SpFSAK84
# Dxf1L3mBZdmptWvkx872ynoAb0swRCQiPM/tA6WWj1kpvLb9BOFwnzJKJ/1Vry/+
# tuWOM7tiX5rbV0Dp8c6ZZpCM/2pif93FSguRJuI57BlKcWOdeyFtw5yjojz6f32W
# apB4pm3S4Zz5Hfw42JT0xqUKloakvZ4argRCg7i1gJsiOCC1JeVk7Pf0v35jWSUP
# ei45V3aicaoGig+JFrphpxHLmtgOR5qAxdDNp9DvfYPw4TtxCd9ddJgiCGHasFAe
# b73x4QDf5zEHpJM692VHeOj4qEir995yfmFrb3epgcunCaw5u+zGy9iCtHLNHfS4
# hQEegPsbiSpUObJb2sgNVZl6h3M7COaYLeqN4DMuEin1wC9UJyH3yKxO2ii4sanb
# lrKnQqLJzxlBTeCG+SqaoxFmMNO7dDJL32N79ZmKLxvHIa9Zta7cRDyXUHHXodLF
# VeNp3lfB0d4wwP3M5k37Db9dT+mdHhk4L7zPWAUu7w2gUDXa7wknHNWzfjUeCLra
# NtvTX4/edIhJEqGCAs4wggI3AgEBMIH4oYHQpIHNMIHKMQswCQYDVQQGEwJVUzEL
# MAkGA1UECBMCV0ExEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29m
# dCBDb3Jwb3JhdGlvbjEtMCsGA1UECxMkTWljcm9zb2Z0IElyZWxhbmQgT3BlcmF0
# aW9ucyBMaW1pdGVkMSYwJAYDVQQLEx1UaGFsZXMgVFNTIEVTTjpBMjQwLTRCODIt
# MTMwRTElMCMGA1UEAxMcTWljcm9zb2Z0IFRpbWUtU3RhbXAgc2VydmljZaIjCgEB
# MAcGBSsOAwIaAxUAxnmkjOXedpqyHQqkJGn7ewhSC9GggYMwgYCkfjB8MQswCQYD
# VQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEe
# MBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMSYwJAYDVQQDEx1NaWNyb3Nv
# ZnQgVGltZS1TdGFtcCBQQ0EgMjAxMDANBgkqhkiG9w0BAQUFAAIFAN/DghcwIhgP
# MjAxODEyMTgyMjI2MzFaGA8yMDE4MTIxOTIyMjYzMVowdzA9BgorBgEEAYRZCgQB
# MS8wLTAKAgUA38OCFwIBADAKAgEAAgImDAIB/zAHAgEAAgIRyDAKAgUA38TTlwIB
# ADA2BgorBgEEAYRZCgQCMSgwJjAMBgorBgEEAYRZCgMCoAowCAIBAAIDB6EgoQow
# CAIBAAIDAYagMA0GCSqGSIb3DQEBBQUAA4GBAFdpRTR+5mmud0tDeQGp4VJt0Xde
# wGSdVAcmGsVuG5EcAYfR+U8xTHK+YAlfdAvsdW4DIl3maCU3MmhkmFyPfhx7LgCW
# zTx+bcePYKKFFHo4prEQ+VduAgOqTxBO8SP79qeCU2LnRFLr9hR3PGCIanM6Weoo
# CWL+UHZbb/WI2v+HMYIDDTCCAwkCAQEwgZMwfDELMAkGA1UEBhMCVVMxEzARBgNV
# BAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jv
# c29mdCBDb3Jwb3JhdGlvbjEmMCQGA1UEAxMdTWljcm9zb2Z0IFRpbWUtU3RhbXAg
# UENBIDIwMTACEzMAAADgship1NHCtPcAAAAAAOAwDQYJYIZIAWUDBAIBBQCgggFK
# MBoGCSqGSIb3DQEJAzENBgsqhkiG9w0BCRABBDAvBgkqhkiG9w0BCQQxIgQgAl4v
# 8Nwn0vjX3iJI2VeuBS0Nv5xGOia25PZg0DpXf+gwgfoGCyqGSIb3DQEJEAIvMYHq
# MIHnMIHkMIG9BCClgS9VpDMosldyg1GQPVVk5wwNOD+Pcl2aoLvRrEJfkDCBmDCB
# gKR+MHwxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQH
# EwdSZWRtb25kMR4wHAYDVQQKExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xJjAkBgNV
# BAMTHU1pY3Jvc29mdCBUaW1lLVN0YW1wIFBDQSAyMDEwAhMzAAAA4LIYqdTRwrT3
# AAAAAADgMCIEIAV95tB4Hyx9UlwuqqwXikFYbiZEcDF6QghwAVuQsxajMA0GCSqG
# SIb3DQEBCwUABIIBALOCczfd6KkkkNWhqyybQLdImrHrJYnMytwgkSDaUx3wa2D+
# +cG9L18ugPl289P2quabT+nV/nTWLmimDaXRmnDoHxD3iR1oopqv/r05x8gSpt8f
# 0qi1bHZiJwbq1+ts21ylCZDbQ2fJBHH3yDKfqonRjdaFgM7xwfo7P6aVNwCcJl5b
# Lo/jlRJFiI3ZSnUQbFBiwJULu3z0XdeZy5TRgnR64bIEttJ1B8Bc5oIN1gT0a6Ve
# KHb2bMGiFZl0AqcTVf/gqtO4AQ8hnxTviCqnIMjCs+vPn14GhhGhuBZgrD5JBbds
# bno/ARtUbsgwCshFYBiTyS0pZ7LJVxPZY5IOhu8=
# SIG # End signature block
