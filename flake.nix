{
  description = "Reminder Bot development environment";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-26.05";

  outputs =
    { nixpkgs, ... }:
    let
      systems = [
        "aarch64-linux"
        "x86_64-linux"
      ];
    in
    {
      devShells = nixpkgs.lib.genAttrs systems (
        system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
        in
        {
          default = pkgs.mkShell {
            packages = with pkgs; [
              nodejs_24
              corepack
            ];

            shellHook = ''
              export COREPACK_HOME="$PWD/.direnv/corepack"
              export PATH="$PWD/.direnv/corepack-bin:$PATH"
              mkdir -p "$COREPACK_HOME" "$PWD/.direnv/corepack-bin"
              corepack enable --install-directory "$PWD/.direnv/corepack-bin"
            '';
          };
        }
      );
    };
}
