const {
  withXcodeProject,
  withEntitlementsPlist,
  withInfoPlist,
} = require("expo/config-plugins");
const path = require("path");
const fs = require("fs");

const EXTENSION_NAME = "BlackoutMonitor";

module.exports = function withExpoFamilyControls(config) {
  const bundleId = config.ios?.bundleIdentifier ?? "com.alperergune.blackout";
  const extensionBundleId = `${bundleId}.${EXTENSION_NAME}`;
  const appGroup = `group.${bundleId}`;
  const teamId = config.ios?.appleTeamId ?? "89LKPT4J88";

  config = withInfoPlist(config, (mod) => {
    const modes = mod.modResults.UIBackgroundModes || [];
    if (!modes.includes("remote-notification")) {
      modes.push("remote-notification");
    }
    mod.modResults.UIBackgroundModes = modes;
    return mod;
  });

  config = withEntitlementsPlist(config, (mod) => {
    mod.modResults["com.apple.security.application-groups"] = [appGroup];
    return mod;
  });

  config = withXcodeProject(config, (mod) => {
    const proj = mod.modResults;
    const platformRoot = mod.modRequest.platformProjectRoot;
    const projectRoot = mod.modRequest.projectRoot;
    const objects = proj.hash.project.objects;

    // --- Copy extension source files into ios/BlackoutMonitor/ ---
    const destDir = path.join(platformRoot, EXTENSION_NAME);
    fs.mkdirSync(destDir, { recursive: true });

    const srcDir = path.resolve(
      projectRoot,
      "modules/expo-family-controls/ios/BlackoutMonitor"
    );
    for (const file of ["DeviceActivityMonitorExtension.swift", "Info.plist"]) {
      const src = path.join(srcDir, file);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, path.join(destDir, file));
      }
    }

    // Generate entitlements for the extension
    fs.writeFileSync(
      path.join(destDir, `${EXTENSION_NAME}.entitlements`),
      [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">',
        '<plist version="1.0">',
        "<dict>",
        "\t<key>com.apple.developer.family-controls</key>",
        "\t<true/>",
        "\t<key>com.apple.security.application-groups</key>",
        "\t<array>",
        `\t\t<string>${appGroup}</string>`,
        "\t</array>",
        "</dict>",
        "</plist>",
        "",
      ].join("\n")
    );

    // --- Skip if extension target already exists ---
    const nativeTargets = objects["PBXNativeTarget"];
    for (const key in nativeTargets) {
      if (key.endsWith("_comment")) continue;
      const t = nativeTargets[key];
      if (t && typeof t === "object" && t.name === `"${EXTENSION_NAME}"`) {
        return mod;
      }
    }

    // --- Add extension target (creates target, configs, product ref, dependency, embed) ---
    const target = proj.addTarget(
      EXTENSION_NAME,
      "app_extension",
      EXTENSION_NAME,
      extensionBundleId
    );
    const targetObj = objects["PBXNativeTarget"][target.uuid];

    // --- Create file reference for the Swift source ---
    const swiftFileRefUuid = proj.generateUuid();
    objects["PBXFileReference"][swiftFileRefUuid] = {
      isa: "PBXFileReference",
      lastKnownFileType: "sourcecode.swift",
      name: '"DeviceActivityMonitorExtension.swift"',
      path: `"${EXTENSION_NAME}/DeviceActivityMonitorExtension.swift"`,
      sourceTree: '"<group>"',
    };
    objects["PBXFileReference"][`${swiftFileRefUuid}_comment`] =
      "DeviceActivityMonitorExtension.swift";

    // --- Create PBXBuildFile for the source ---
    const srcBuildFileUuid = proj.generateUuid();
    objects["PBXBuildFile"][srcBuildFileUuid] = {
      isa: "PBXBuildFile",
      fileRef: swiftFileRefUuid,
      fileRef_comment: "DeviceActivityMonitorExtension.swift",
    };
    objects["PBXBuildFile"][`${srcBuildFileUuid}_comment`] =
      "DeviceActivityMonitorExtension.swift in Sources";

    // --- Create Sources build phase and add the source file ---
    const sourcesPhaseUuid = proj.generateUuid();
    objects["PBXSourcesBuildPhase"][sourcesPhaseUuid] = {
      isa: "PBXSourcesBuildPhase",
      buildActionMask: 2147483647,
      files: [
        {
          value: srcBuildFileUuid,
          comment: "DeviceActivityMonitorExtension.swift in Sources",
        },
      ],
      runOnlyForDeploymentPostprocessing: 0,
    };
    objects["PBXSourcesBuildPhase"][`${sourcesPhaseUuid}_comment`] = "Sources";

    // --- Create Frameworks build phase (empty — system frameworks auto-link via Swift imports) ---
    const fwPhaseUuid = proj.generateUuid();
    objects["PBXFrameworksBuildPhase"][fwPhaseUuid] = {
      isa: "PBXFrameworksBuildPhase",
      buildActionMask: 2147483647,
      files: [],
      runOnlyForDeploymentPostprocessing: 0,
    };
    objects["PBXFrameworksBuildPhase"][`${fwPhaseUuid}_comment`] = "Frameworks";

    // --- Wire build phases onto the extension target ---
    targetObj.buildPhases = [
      { value: sourcesPhaseUuid, comment: "Sources" },
      { value: fwPhaseUuid, comment: "Frameworks" },
    ];

    // --- Add a PBXGroup so the file shows in the project navigator ---
    const groupUuid = proj.generateUuid();
    objects["PBXGroup"][groupUuid] = {
      isa: "PBXGroup",
      children: [
        {
          value: swiftFileRefUuid,
          comment: "DeviceActivityMonitorExtension.swift",
        },
      ],
      name: `"${EXTENSION_NAME}"`,
      path: `"${EXTENSION_NAME}"`,
      sourceTree: '"<group>"',
    };
    objects["PBXGroup"][`${groupUuid}_comment`] = EXTENSION_NAME;

    const mainGroupKey = proj.getFirstProject().firstProject.mainGroup;
    const mainGroup = objects["PBXGroup"][mainGroupKey];
    if (mainGroup && mainGroup.children) {
      mainGroup.children.push({
        value: groupUuid,
        comment: EXTENSION_NAME,
      });
    }

    // --- Set build settings on the extension's configurations ---
    const configListUuid = target.pbxNativeTarget.buildConfigurationList;
    const extConfigList = objects["XCConfigurationList"][configListUuid];

    if (extConfigList && extConfigList.buildConfigurations) {
      for (const ref of extConfigList.buildConfigurations) {
        const cfg = objects["XCBuildConfiguration"][ref.value];
        if (!cfg || !cfg.buildSettings) continue;
        Object.assign(cfg.buildSettings, {
          PRODUCT_BUNDLE_IDENTIFIER: `"${extensionBundleId}"`,
          INFOPLIST_FILE: `"${EXTENSION_NAME}/Info.plist"`,
          CODE_SIGN_ENTITLEMENTS: `"${EXTENSION_NAME}/${EXTENSION_NAME}.entitlements"`,
          SWIFT_VERSION: '"5.0"',
          IPHONEOS_DEPLOYMENT_TARGET: '"16.0"',
          DEVELOPMENT_TEAM: `"${teamId}"`,
          CODE_SIGN_STYLE: '"Automatic"',
          TARGETED_DEVICE_FAMILY: '"1,2"',
          GENERATE_INFOPLIST_FILE: '"NO"',
          CURRENT_PROJECT_VERSION: '"1"',
          MARKETING_VERSION: '"1.0"',
          SKIP_INSTALL: '"YES"',
          LD_RUNPATH_SEARCH_PATHS:
            '"$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks"',
        });
      }
    }

    return mod;
  });

  return config;
};
